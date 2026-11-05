import React from 'react';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import ContactUs from './ContactUs';
import {submitInquiry} from '../services/inquiries';
jest.mock('../services/inquiries',()=>({submitInquiry:jest.fn()}));
beforeEach(()=>{jest.clearAllMocks();let n=0;Object.defineProperty(window,'crypto',{configurable:true,value:{randomUUID:()=>`test-request-id-${++n}`}});});
const mount=(entry='/contact')=>render(<MemoryRouter initialEntries={[entry]}><ContactUs/></MemoryRouter>);
function fill(){fireEvent.change(screen.getByLabelText(/Your name/),{target:{value:'Test Reader'}});fireEvent.change(screen.getByLabelText(/Email address/),{target:{value:'reader@example.org'}});fireEvent.change(screen.getByLabelText(/Your message/),{target:{value:'Here is my feedback about the website.'}});}
test('investment entry point is visible and selects the investment inquiry form',async()=>{
  mount();fireEvent.click(screen.getByRole('button',{name:/Discuss an investment/}));
  expect(screen.getByLabelText(/What would you like to share/).value).toBe('investment');
  expect(screen.getByRole('button',{name:/Send investment inquiry/})).toBeTruthy();expect(submitInquiry).not.toHaveBeenCalled();
});
test('agent-prepared inquiry shows a review message and leaves contact consent unchecked',async()=>{
  mount({pathname:'/contact',state:{inquiryDraft:{kind:'investment',name:'Test Investor',email:'investor@example.org',message:'I would like to discuss investing.'}}});
  expect(await screen.findByText(/Your draft is ready/)).toBeTruthy();expect(screen.getByLabelText(/Your name/).value).toBe('Test Investor');
  expect(screen.getByRole('checkbox').checked).toBe(false);expect(submitInquiry).not.toHaveBeenCalled();
});
test('consent is required; successful submission returns a receipt and clears private form fields',async()=>{
  submitInquiry.mockResolvedValue({status:'received',reference:'receipt-123',kind:'experience'});mount();fill();
  fireEvent.submit(screen.getByRole('form',{name:'Contact inquiry'}));expect(submitInquiry).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('checkbox'));fireEvent.submit(screen.getByRole('form',{name:'Contact inquiry'}));
  await screen.findByText(/Thank you. Your inquiry is saved/);
  expect(submitInquiry).toHaveBeenCalledWith(expect.objectContaining({kind:'experience',consent:true,email:'reader@example.org',requestId:'test-request-id-1'}));
  expect(screen.getByLabelText(/Email address/).value).toBe('');expect(screen.getByRole('checkbox').checked).toBe(false);
});
test('uncertain retries preserve details and the request ID; double submissions do not duplicate',async()=>{
  submitInquiry.mockRejectedValueOnce(new Error('Connection interrupted')).mockResolvedValue({status:'received',reference:'same-receipt',kind:'experience'});
  mount();fill();fireEvent.click(screen.getByRole('checkbox'));
  const form=screen.getByRole('form',{name:'Contact inquiry'});fireEvent.submit(form);fireEvent.submit(form);
  await screen.findByRole('alert');expect(submitInquiry).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText(/Email address/).value).toBe('reader@example.org');
  fireEvent.submit(form);await screen.findByText(/Thank you. Your inquiry is saved/);
  expect(submitInquiry).toHaveBeenCalledTimes(2);expect(submitInquiry.mock.calls[0][0].requestId).toBe(submitInquiry.mock.calls[1][0].requestId);
});
