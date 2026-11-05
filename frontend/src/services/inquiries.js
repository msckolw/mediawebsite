import api from './api';
export async function submitInquiry(details) {
  try {return (await api.post('/inquiries',details)).data;}
  catch(error) {throw new Error(error.response?.data?.message || 'Could not confirm that your inquiry was saved. Retry with the same details to avoid a duplicate.');}
}
