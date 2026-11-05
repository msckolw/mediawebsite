// Shared routing/build definitions. Prerender the actual React copy, not a duplicate.
module.exports = [
  {path:'/about', component:'AboutUs', title:'About Us', description:'The mission, editorial values, and work of The NoBias Media.'},
  {path:'/contact', component:'ContactUs', title:'Contact Us', description:'Share your experience, suggest improvements, or discuss investing in The NoBias Media.'},
  {path:'/media-bias-details', component:'MediaBiasDetails', title:'Media Bias Details', description:'Understand source labels and The NoBias Media approach to media bias.'},
  {path:'/privacy-policy', component:'PrivacyPolicy', title:'Privacy Policy', description:'How The NoBias Media handles personal information.', aliases:['/privacy','/privacypolicy']},
  {path:'/terms-conditions', component:'TermsConditions', title:'Terms & Conditions', description:'Terms governing use of The NoBias Media.', aliases:['/terms-and-conditions','/terms','/termsandconditions','/terms-of-use']},
  {path:'/refund-policy', component:'RefundPolicy', title:'Refund and Cancellation Policy', description:'The NoBias Media refund and cancellation policy.', aliases:['/refund','/refundpolicy','/cancellation-policy']},
  {path:'/copyright-claims', component:'CopyrightClaims', title:'Copyright Claims & DMCA Notice', description:'How to report copyright concerns to The NoBias Media.'},
  {path:'/delete-account', component:'DeleteAccount', title:'Delete Account', description:'How to request deletion of your The NoBias Media account.'}
];
