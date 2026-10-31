import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NewsAssistant from './NewsAssistant';
import { useSession } from '../context/SessionContext';
import api from '../services/api';

jest.mock('../context/SessionContext',()=>({useSession:jest.fn()}));
jest.mock('../services/api',()=>({__esModule:true,default:{get:jest.fn(),post:jest.fn(),put:jest.fn()}}));
const id='507f1f77bcf86cd799439011';
const job={_id:id,topic:'Test topic',status:'ready',stage:'complete',category:'politics',fromDate:'2026-10-28',toDate:'2026-10-28',revision:0,
  draft:{title:'Test headline',summary:'Supported summary',content:'Supported article body',sourceIds:['S1','S2'],claims:[]},warnings:[],reviews:[],versions:[],usage:[]};
beforeEach(()=>{
  jest.clearAllMocks();useSession.mockReturnValue({loading:false,user:{role:'admin'}});
  api.get.mockImplementation(async url=>({data:url.endsWith('/config') ? {enabled:true,configured:true,research:{provider:'parallel',mode:'fast'},models:{writer:'Luna',reviewer:'Grok'},articleCategories:['politics'],budget:{estimatedAndReservedUsd:0,allowanceUsd:20}}
    : url.endsWith('/outlets') ? [] : url.includes(`assignments/${id}`) ? job : [{...job,createdAt:'2026-10-28T00:00:00Z'}]}));
});
const mount=()=>render(<MemoryRouter><NewsAssistant /></MemoryRouter>);

test('readers cannot load administrative research data',()=>{
  useSession.mockReturnValue({loading:false,user:{role:'user'}});mount();expect(api.get).not.toHaveBeenCalled();
});

test('publishing stays disabled until an approval note and explicit checkbox are supplied',async()=>{
  mount();fireEvent.click(await screen.findByRole('button',{name:/Test topic/}));
  const publish=await screen.findByRole('button',{name:'Approve and publish'});expect(publish.disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Your review note'),{target:{value:'Checked the sources and image permission.'}});
  fireEvent.click(screen.getByRole('checkbox',{name:/I reviewed this article/}));expect(publish.disabled).toBe(false);
  fireEvent.change(screen.getByLabelText('Title'),{target:{value:'Edited headline'}});expect(publish.disabled).toBe(true);
  expect(screen.getByRole('button',{name:'Save draft edits'}).disabled).toBe(false);
});

test('unsaved edits cannot publish and a save includes the revision for conflict detection',async()=>{
  api.put.mockResolvedValue({data:{...job,revision:1,humanEdited:true}});
  mount();fireEvent.click(await screen.findByRole('button',{name:/Test topic/}));await screen.findByLabelText('Title');
  fireEvent.change(screen.getByLabelText('Title'),{target:{value:'Edited headline'}});
  fireEvent.click(screen.getByRole('button',{name:'Save draft edits'}));
  await waitFor(()=>expect(api.put).toHaveBeenCalledWith(`/admin/assistant/assignments/${id}/draft`,expect.objectContaining({revision:0,draft:expect.objectContaining({title:'Edited headline'})})));
  expect(api.post).not.toHaveBeenCalled();
});

test('source library is available while research is disabled and defaults import is explicit',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:'Source library'}));
  await screen.findByRole('button',{name:'Import media-sheet starter library'});expect(api.post).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Allowed domains (comma separated)')).toBeTruthy();
});

test('workspace identifies Parallel search separately from writing and review',async()=>{
  mount();await screen.findByText('Parallel + Luna + Grok');
  expect(screen.getByText('Search with Parallel. Write with Luna. Review with Grok. Publish with your approval.')).toBeTruthy();
});

test('Parallel usage displays search requests without invented token usage',async()=>{
  const withUsage={...job,usage:[{provider:'parallel',stage:'research',model:'parallel-search/fast',searchCalls:1,inputTokens:0,outputTokens:0,estimatedUsd:0.001}]};
  const previous=api.get.getMockImplementation();
  api.get.mockImplementation(async url=>url.includes(`assignments/${id}`) ? {data:withUsage} : previous(url));
  mount();fireEvent.click(await screen.findByRole('button',{name:/Test topic/}));
  const usage=await screen.findByText(/research · parallel-search\/fast/);
  expect(usage.textContent).toContain('1 search request(s)');expect(usage.textContent).not.toContain('tokens');
  expect(screen.getByText('API usage')).toBeTruthy();
});
