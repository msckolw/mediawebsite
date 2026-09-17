import React from 'react';
import '../styles/LegalPages.css';

const RefundPolicy = () => {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Refund and Cancellation Policy</h1>

        <section>
          <p>
            This refund and cancellation policy outlines how you can cancel or seek a refund for a product / service
            that you have purchased through the Platform. Under this policy:
          </p>
          
          <ol>
            <li>
              Cancellations will only be considered if the request is made <strong>2 days</strong> of placing the order. However,
              cancellation requests may not be entertained if the orders have been communicated to such sellers /
              merchant(s) listed on the Platform and they have initiated the process of shipping them, or the
              product is out for delivery. In such an event, you may choose to reject the product at the doorstep.
            </li>
            
            <li>
              <strong>The NoBias Media</strong> does not accept cancellation requests for perishable items like flowers, eatables, etc.
              However, the refund / replacement can be made if the user establishes that the quality of the
              product delivered is not good.
            </li>
            
            <li>
              In case of receipt of damaged or defective items, please report to our customer service team. The
              request would be entertained once the seller/ merchant listed on the Platform, has checked and
              determined the same at its own end. This should be reported within <strong>2 days</strong> of receipt of products.
              In case you feel that the product received is not as shown on the site or as per your expectations,
              you must bring it to the notice of our customer service within <strong>2 days</strong> of receiving the product. The
              customer service team after looking into your complaint will take an appropriate decision.
            </li>
            
            <li>
              In case of complaints regarding the products that come with a warranty from the manufacturers,
              please refer the issue to them.
            </li>
            
            <li>
              In case of any refunds approved by <strong>The NoBias Media</strong>, it will take <strong>2 days</strong> for the refund to be processed
              to you.
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
};

export default RefundPolicy;
