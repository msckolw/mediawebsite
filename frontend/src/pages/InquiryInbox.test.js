import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import InquiryInbox from './InquiryInbox';
import {useSession} from '../context/SessionContext';
import api from '../services/api';
jest.mock('../context/SessionContext',()=>({useSession:jest.fn()}));
jest.mock('../services/api',()=>({__esModule:true,default:{get:jest.fn(),put:jest.fn(),post:jest.fn()}}));
const user={role:'admin'};
beforeEach(()=>{jest.clearAllMocks();useSession.mockReturnValue({user,loading:false});api.get.mockResolvedValue({data:{items:[],page:1,totalPages:0}});});
const mount=()=>render(<MemoryRouter><InquiryInbox/></MemoryRouter>);
test('anonymous users and readers cannot load inquiry data',()=>{
  useSession.mockReturnValue({user:{role:'user'},loading:false});mount();expect(api.get).not.toHaveBeenCalled();
});
test('inbox defaults to investment interest and supports all inquiries',async()=>{
  mount();await waitFor(()=>expect(api.get).toHaveBeenCalledWith('/admin/inquiries?kind=investment&page=1'));
  fireEvent.change(screen.getByLabelText('Show'),{target:{value:'all'}});
  await waitFor(()=>expect(api.get).toHaveBeenCalledWith('/admin/inquiries?kind=all&page=1'));
});
test('messages render as plain text and notification errors remain visible',async()=>{
  api.get.mockResolvedValue({data:{items:[{_id:'507f1f77bcf86cd799439011',kind:'investment',name:'Test Investor',email:'investor@example.org',message:'<script>unsafe()</script>',status:'new',createdAt:'2026-11-05T00:00:00Z',notification:{status:'failed'}}],page:1,totalPages:1}});
  api.post.mockResolvedValue({data:{status:'pending'}});mount();await screen.findByText('<script>unsafe()</script>');
  expect(document.querySelector('script')).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Retry email notification'}));
  expect((await screen.findByRole('alert')).textContent).toContain('Check the Resend configuration');
});
