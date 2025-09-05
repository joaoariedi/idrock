import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCart } from '../contexts/CartContext';
import { useIdRock } from '../contexts/IdRockContext';
import { toast } from 'react-toastify';
import './CheckoutPage.css';

function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const { assessCheckoutRisk, trackEvent, isAssessing, currentRiskAssessment, RISK_LEVELS } = useIdRock();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      shippingAddress: '',
      shippingCity: '',
      shippingState: '',
      shippingZip: '',
      shippingCountry: 'BR',
      sameAsBilling: true,
      billingAddress: '',
      billingCity: '',
      billingState: '',
      billingZip: '',
      billingCountry: 'BR',
      paymentMethod: 'credit_card',
      cardNumber: '',
      cardExpiry: '',
      cardCvv: '',
      cardName: '',
      acceptTerms: false
    }
  });

  const watchedFields = watch();
  const sameAsBilling = watch('sameAsBilling');

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.items.length === 0) {
      toast.info('Your cart is empty. Please add some items before checkout.');
      navigate('/');
      return;
    }
  }, [cart.items.length, navigate]);

  // Track page view
  useEffect(() => {
    const trackPageView = async () => {
      try {
        await trackEvent('page_view', {
          page: 'checkout',
          step: step,
          itemCount: cart.totalItems,
          totalAmount: cart.totalAmount
        });
      } catch (error) {
        console.error('Error tracking checkout page view:', error);
      }
    };
    
    trackPageView();
  }, [trackEvent, step, cart.totalItems, cart.totalAmount]);

  // Auto-fill billing address when same as shipping
  useEffect(() => {
    if (sameAsBilling) {
      setValue('billingAddress', watchedFields.shippingAddress);
      setValue('billingCity', watchedFields.shippingCity);
      setValue('billingState', watchedFields.shippingState);
      setValue('billingZip', watchedFields.shippingZip);
      setValue('billingCountry', watchedFields.shippingCountry);
    }
  }, [sameAsBilling, watchedFields.shippingAddress, watchedFields.shippingCity, 
      watchedFields.shippingState, watchedFields.shippingZip, watchedFields.shippingCountry, setValue]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatCardNumber = (value) => {
    return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length >= 2) {
      return cleanValue.slice(0, 2) + '/' + cleanValue.slice(2, 4);
    }
    return cleanValue;
  };

  const validateCardNumber = (value) => {
    const cleanValue = value.replace(/\s/g, '');
    if (cleanValue.length !== 16) return false;
    
    // Luhn algorithm
    let sum = 0;
    let isEven = false;
    for (let i = cleanValue.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanValue[i]);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  };

  const validateExpiry = (value) => {
    const [month, year] = value.split('/');
    if (!month || !year || month.length !== 2 || year.length !== 2) return false;
    
    const monthNum = parseInt(month);
    const yearNum = parseInt('20' + year);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    if (monthNum < 1 || monthNum > 12) return false;
    if (yearNum < currentYear) return false;
    if (yearNum === currentYear && monthNum < currentMonth) return false;
    
    return true;
  };

  const nextStep = async () => {
    let fieldsToValidate = [];
    
    if (step === 1) {
      fieldsToValidate = ['email', 'firstName', 'lastName', 'phone'];
    } else if (step === 2) {
      fieldsToValidate = ['shippingAddress', 'shippingCity', 'shippingState', 'shippingZip'];
      if (!sameAsBilling) {
        fieldsToValidate.push(...['billingAddress', 'billingCity', 'billingState', 'billingZip']);
      }
    } else if (step === 3) {
      fieldsToValidate = ['cardNumber', 'cardExpiry', 'cardCvv', 'cardName'];
    }
    
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      setStep(step + 1);
      
      try {
        await trackEvent('checkout_step_complete', {
          step: step,
          totalSteps: 4
        });
      } catch (error) {
        console.error('Error tracking step completion:', error);
      }
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const performRiskAssessment = async (formData) => {
    const checkoutData = {
      amount: cart.totalAmount,
      currency: 'BRL',
      items: cart.items,
      customerInfo: {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      },
      shippingAddress: {
        address: formData.shippingAddress,
        city: formData.shippingCity,
        state: formData.shippingState,
        zip: formData.shippingZip,
        country: formData.shippingCountry
      },
      billingAddress: {
        address: sameAsBilling ? formData.shippingAddress : formData.billingAddress,
        city: sameAsBilling ? formData.shippingCity : formData.billingCity,
        state: sameAsBilling ? formData.shippingState : formData.billingState,
        zip: sameAsBilling ? formData.shippingZip : formData.billingZip,
        country: sameAsBilling ? formData.shippingCountry : formData.billingCountry
      },
      paymentMethod: formData.paymentMethod
    };

    try {
      const assessment = await assessCheckoutRisk(checkoutData);
      setRiskAssessment(assessment);
      return assessment;
    } catch (error) {
      console.error('Risk assessment failed:', error);
      toast.error('Unable to complete security check. Please try again.');
      return null;
    }
  };

  const processOrder = async (formData) => {
    setIsProcessingOrder(true);
    
    try {
      // Simulate order processing delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Track successful order
      await trackEvent('order_complete', {
        orderId: 'ORDER_' + Date.now(),
        itemCount: cart.totalItems,
        totalAmount: cart.totalAmount,
        paymentMethod: formData.paymentMethod,
        riskLevel: riskAssessment?.riskLevel || 'UNKNOWN',
        riskScore: riskAssessment?.riskScore || 0
      });
      
      clearCart();
      toast.success('Order placed successfully!');
      navigate('/');
      
    } catch (error) {
      console.error('Order processing failed:', error);
      toast.error('Order processing failed. Please try again.');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  const onSubmit = async (formData) => {
    if (step < 4) {
      nextStep();
      return;
    }

    if (!formData.acceptTerms) {
      toast.error('Please accept the terms and conditions to proceed.');
      return;
    }

    // Perform risk assessment
    const assessment = await performRiskAssessment(formData);
    if (!assessment) return;

    // Handle high-risk transactions
    if (assessment.riskLevel === 'HIGH') {
      toast.warn('This transaction requires additional verification. Please contact customer support.');
      return;
    }

    // Process order
    await processOrder(formData);
  };

  if (cart.items.length === 0) {
    return <div>Loading...</div>;
  }

  const getRiskLevelDisplay = (level) => {
    const config = RISK_LEVELS[level] || RISK_LEVELS.MEDIUM;
    return (
      <div className={`risk-indicator risk-${level.toLowerCase()}`}>
        <div className="risk-icon">
          {level === 'LOW' ? '✅' : level === 'MEDIUM' ? '⚠️' : '❌'}
        </div>
        <div className="risk-details">
          <div className="risk-level">{level} Risk</div>
          <div className="risk-description">{config.description}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Progress Bar */}
        <div className="checkout-progress">
          <div className="progress-bar">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`progress-step ${stepNum <= step ? 'active' : ''} ${stepNum < step ? 'completed' : ''}`}
              >
                <div className="step-circle">
                  {stepNum < step ? '✓' : stepNum}
                </div>
                <div className="step-label">
                  {stepNum === 1 && 'Contact Info'}
                  {stepNum === 2 && 'Shipping'}
                  {stepNum === 3 && 'Payment'}
                  {stepNum === 4 && 'Review'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="checkout-content">
          {/* Main Form */}
          <div className="checkout-form">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 1: Contact Information */}
              {step === 1 && (
                <div className="form-step">
                  <h2 className="step-title">Contact Information</h2>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="error-message">{errors.email.message}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name *</label>
                      <input
                        type="text"
                        id="firstName"
                        {...register('firstName', {
                          required: 'First name is required',
                          minLength: { value: 2, message: 'First name must be at least 2 characters' }
                        })}
                        className={errors.firstName ? 'error' : ''}
                      />
                      {errors.firstName && <span className="error-message">{errors.firstName.message}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="lastName">Last Name *</label>
                      <input
                        type="text"
                        id="lastName"
                        {...register('lastName', {
                          required: 'Last name is required',
                          minLength: { value: 2, message: 'Last name must be at least 2 characters' }
                        })}
                        className={errors.lastName ? 'error' : ''}
                      />
                      {errors.lastName && <span className="error-message">{errors.lastName.message}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      {...register('phone', {
                        required: 'Phone number is required',
                        pattern: {
                          value: /^[\+]?[1-9][\d]{0,15}$/,
                          message: 'Invalid phone number'
                        }
                      })}
                      className={errors.phone ? 'error' : ''}
                    />
                    {errors.phone && <span className="error-message">{errors.phone.message}</span>}
                  </div>
                </div>
              )}

              {/* Step 2: Shipping & Billing */}
              {step === 2 && (
                <div className="form-step">
                  <h2 className="step-title">Shipping Information</h2>
                  
                  <div className="form-group">
                    <label htmlFor="shippingAddress">Address *</label>
                    <input
                      type="text"
                      id="shippingAddress"
                      {...register('shippingAddress', {
                        required: 'Address is required',
                        minLength: { value: 10, message: 'Please enter a complete address' }
                      })}
                      className={errors.shippingAddress ? 'error' : ''}
                    />
                    {errors.shippingAddress && <span className="error-message">{errors.shippingAddress.message}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="shippingCity">City *</label>
                      <input
                        type="text"
                        id="shippingCity"
                        {...register('shippingCity', {
                          required: 'City is required'
                        })}
                        className={errors.shippingCity ? 'error' : ''}
                      />
                      {errors.shippingCity && <span className="error-message">{errors.shippingCity.message}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="shippingState">State *</label>
                      <input
                        type="text"
                        id="shippingState"
                        {...register('shippingState', {
                          required: 'State is required'
                        })}
                        className={errors.shippingState ? 'error' : ''}
                      />
                      {errors.shippingState && <span className="error-message">{errors.shippingState.message}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="shippingZip">ZIP Code *</label>
                      <input
                        type="text"
                        id="shippingZip"
                        {...register('shippingZip', {
                          required: 'ZIP code is required',
                          pattern: {
                            value: /^\d{5}-?\d{3}$/,
                            message: 'Invalid ZIP code format'
                          }
                        })}
                        className={errors.shippingZip ? 'error' : ''}
                      />
                      {errors.shippingZip && <span className="error-message">{errors.shippingZip.message}</span>}
                    </div>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        {...register('sameAsBilling')}
                      />
                      <span className="checkbox-custom"></span>
                      Billing address is the same as shipping address
                    </label>
                  </div>

                  {!sameAsBilling && (
                    <div className="billing-section">
                      <h3>Billing Information</h3>
                      
                      <div className="form-group">
                        <label htmlFor="billingAddress">Billing Address *</label>
                        <input
                          type="text"
                          id="billingAddress"
                          {...register('billingAddress', {
                            required: !sameAsBilling ? 'Billing address is required' : false
                          })}
                          className={errors.billingAddress ? 'error' : ''}
                        />
                        {errors.billingAddress && <span className="error-message">{errors.billingAddress.message}</span>}
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="billingCity">City *</label>
                          <input
                            type="text"
                            id="billingCity"
                            {...register('billingCity', {
                              required: !sameAsBilling ? 'City is required' : false
                            })}
                            className={errors.billingCity ? 'error' : ''}
                          />
                          {errors.billingCity && <span className="error-message">{errors.billingCity.message}</span>}
                        </div>

                        <div className="form-group">
                          <label htmlFor="billingState">State *</label>
                          <input
                            type="text"
                            id="billingState"
                            {...register('billingState', {
                              required: !sameAsBilling ? 'State is required' : false
                            })}
                            className={errors.billingState ? 'error' : ''}
                          />
                          {errors.billingState && <span className="error-message">{errors.billingState.message}</span>}
                        </div>

                        <div className="form-group">
                          <label htmlFor="billingZip">ZIP Code *</label>
                          <input
                            type="text"
                            id="billingZip"
                            {...register('billingZip', {
                              required: !sameAsBilling ? 'ZIP code is required' : false,
                              pattern: !sameAsBilling ? {
                                value: /^\d{5}-?\d{3}$/,
                                message: 'Invalid ZIP code format'
                              } : undefined
                            })}
                            className={errors.billingZip ? 'error' : ''}
                          />
                          {errors.billingZip && <span className="error-message">{errors.billingZip.message}</span>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <div className="form-step">
                  <h2 className="step-title">Payment Information</h2>
                  
                  <div className="form-group">
                    <label htmlFor="cardName">Name on Card *</label>
                    <input
                      type="text"
                      id="cardName"
                      {...register('cardName', {
                        required: 'Name on card is required'
                      })}
                      className={errors.cardName ? 'error' : ''}
                    />
                    {errors.cardName && <span className="error-message">{errors.cardName.message}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="cardNumber">Card Number *</label>
                    <input
                      type="text"
                      id="cardNumber"
                      maxLength="19"
                      {...register('cardNumber', {
                        required: 'Card number is required',
                        validate: (value) => validateCardNumber(value) || 'Invalid card number'
                      })}
                      onChange={(e) => {
                        e.target.value = formatCardNumber(e.target.value);
                      }}
                      className={errors.cardNumber ? 'error' : ''}
                      placeholder="1234 5678 9012 3456"
                    />
                    {errors.cardNumber && <span className="error-message">{errors.cardNumber.message}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="cardExpiry">Expiry Date *</label>
                      <input
                        type="text"
                        id="cardExpiry"
                        maxLength="5"
                        {...register('cardExpiry', {
                          required: 'Expiry date is required',
                          validate: (value) => validateExpiry(value) || 'Invalid expiry date'
                        })}
                        onChange={(e) => {
                          e.target.value = formatExpiry(e.target.value);
                        }}
                        className={errors.cardExpiry ? 'error' : ''}
                        placeholder="MM/YY"
                      />
                      {errors.cardExpiry && <span className="error-message">{errors.cardExpiry.message}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="cardCvv">CVV *</label>
                      <input
                        type="text"
                        id="cardCvv"
                        maxLength="4"
                        {...register('cardCvv', {
                          required: 'CVV is required',
                          pattern: {
                            value: /^\d{3,4}$/,
                            message: 'Invalid CVV'
                          }
                        })}
                        className={errors.cardCvv ? 'error' : ''}
                        placeholder="123"
                      />
                      {errors.cardCvv && <span className="error-message">{errors.cardCvv.message}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review & Risk Assessment */}
              {step === 4 && (
                <div className="form-step">
                  <h2 className="step-title">Review Order</h2>
                  
                  {/* Risk Assessment Display */}
                  {(isAssessing || riskAssessment) && (
                    <div className="risk-assessment-section">
                      <h3>Security Analysis</h3>
                      {isAssessing ? (
                        <div className="risk-loading">
                          <div className="security-scanner">
                            <div className="scanner-icon">🔍</div>
                            <div className="scanner-text">
                              <p>Analyzing transaction security...</p>
                              <div className="scanner-progress">
                                <div className="progress-bar-scan"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : riskAssessment && (
                        <div className="risk-result">
                          {getRiskLevelDisplay(riskAssessment.riskLevel)}
                          {riskAssessment.reasons && riskAssessment.reasons.length > 0 && (
                            <div className="risk-reasons">
                              <p><strong>Analysis factors:</strong></p>
                              <ul>
                                {riskAssessment.reasons.map((reason, index) => (
                                  <li key={index}>{reason}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="order-review">
                    <h3>Customer Information</h3>
                    <div className="review-section">
                      <p><strong>Email:</strong> {watchedFields.email}</p>
                      <p><strong>Name:</strong> {watchedFields.firstName} {watchedFields.lastName}</p>
                      <p><strong>Phone:</strong> {watchedFields.phone}</p>
                    </div>

                    <h3>Shipping Address</h3>
                    <div className="review-section">
                      <p>{watchedFields.shippingAddress}</p>
                      <p>{watchedFields.shippingCity}, {watchedFields.shippingState} {watchedFields.shippingZip}</p>
                    </div>

                    <h3>Payment Method</h3>
                    <div className="review-section">
                      <p>Credit Card ending in {watchedFields.cardNumber.slice(-4)}</p>
                    </div>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        {...register('acceptTerms', {
                          required: 'You must accept the terms and conditions'
                        })}
                      />
                      <span className="checkbox-custom"></span>
                      I accept the <a href="#" className="terms-link">Terms and Conditions</a> and <a href="#" className="terms-link">Privacy Policy</a>
                    </label>
                    {errors.acceptTerms && <span className="error-message">{errors.acceptTerms.message}</span>}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="form-actions">
                {step > 1 && (
                  <button type="button" className="btn-secondary" onClick={prevStep}>
                    Previous
                  </button>
                )}
                
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={step === 4 && (isAssessing || isProcessingOrder)}
                >
                  {isProcessingOrder ? (
                    <>
                      <span className="loading-spinner">⏳</span>
                      Processing Order...
                    </>
                  ) : step === 4 ? (
                    <>
                      <span className="secure-icon">🔒</span>
                      Place Order
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <h3>Order Summary</h3>
            
            <div className="summary-items">
              {cart.items.map(item => (
                <div key={item.id} className="summary-item">
                  <img src={item.image} alt={item.name} className="summary-item-image" />
                  <div className="summary-item-details">
                    <div className="summary-item-name">{item.name}</div>
                    <div className="summary-item-quantity">Qty: {item.quantity}</div>
                  </div>
                  <div className="summary-item-price">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(cart.totalAmount)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span className="free-shipping">Free</span>
              </div>
              <div className="summary-row">
                <span>Tax</span>
                <span>Included</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>Total</span>
                <span>{formatPrice(cart.totalAmount)}</span>
              </div>
            </div>
            
            <div className="security-badges">
              <div className="security-badge">
                <span className="badge-icon">🔒</span>
                <span>SSL Encrypted</span>
              </div>
              <div className="security-badge">
                <span className="badge-icon">🛡️</span>
                <span>idRock Protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;