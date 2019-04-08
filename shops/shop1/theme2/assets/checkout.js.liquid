(function($, window, undefined) {
  	var stripe = Stripe('pk_live_OapeDvgecUoh3r3n0exmIJlz'); // STRIPE Public API key
  	var elements = stripe.elements();

  	var products;
  	$.ajax({
        url: '/cart.json',
        contentType: 'application/json',
        success: function(cart){
            products = cart.items;
        },
        error: function(response) {
            if (response.status === 200) {
                var cart = JSON.parse(response.responseText);
                products = cart.items;
            } else {
                products = [];
            }
        }
    });

  	// Custom styling can be passed to options when creating an Element.
  	var style = {
    	base: {
      		// Add your base input styles here. For example:
      		fontSize: '16px',
      		color: "#32325d",
    	}
  	};

  	/* Get Correct Step to Start the card Stripe */

  	var step = $('.step').attr('data-step');

  	if (step.indexOf("payment_method")) {

        // Create an instance of the card Element.
        var card = elements.create('card', {style: style});

        // Add an instance of the card Element into the `card-element` <div>.
        card.mount('#card-element');

        card.addEventListener('change', function(event) {
            var displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
            } else {
                displayError.textContent = '';
            }
        });

        var paymentForm = document.getElementById('payment-form');
        var token = "asdf1234";

        $('#buttonPayment').click(function() {
            console.log("Payment Test " + shop);

            stripe.createToken(card).then(function(result) {
                if (result.error) {
                    // Inform the customer that there was an error.
                    var errorElement = document.getElementById('card-errors');
                    errorElement.textContent = result.error.message;
                } else {
                    token = result.token
                    console.log("Payment Token " + JSON.stringify(token));

                    var shippingAddress = {};
                    $.map($('#shipping-address-form').serializeArray(), function(n, i){
                        shippingAddress[n['name']] = n['value'];
                    });

                    //        var testProduct = products[0];
                    //        testProduct.quantity = 1;
                    //        products.push(testProduct);

                    console.log("createOrderRequest products: '" + JSON.stringify(products) + "'");
                    var createOrderRequest = {};
                    createOrderRequest.shop = shop;
                    createOrderRequest.customerEmail = $('#customer-email').val();
                    createOrderRequest.gatewayType = 'STRIPE';
                    createOrderRequest.gatewayToken = token.id;
                    createOrderRequest.products = products;
                    createOrderRequest.discountCode = {code: $('#checkout_reduction_code').val()};
                    createOrderRequest.shippingAddress = shippingAddress;
                    createOrderRequest.billingAddress = shippingAddress;
                    createOrderRequest.shippingLine = {code: "Free"};
                  	createOrderRequest.cartToken = getCookie('cart');

                    console.log("createOrderRequest: " + JSON.stringify(createOrderRequest));

                    $.ajax({
                        async: false,
                        method: 'POST',
                        url: "https://gateway.ecommerce-wh.com/shopify/checkout/createOrder",
                        contentType: "application/json",
                        data: JSON.stringify(createOrderRequest)
                    }).done(function(response) {
                        console.log("ShopifyOrderId: " + response);

                      	localStorage.setItem('chkEmail', createOrderRequest.customerEmail);
                      	localStorage.setItem('chkOrderId', response);

                      	window.location.href = '/pages/checkout-upsell';


                        /*var upsell = confirm("Do you want to buy another '" + products[0].title + "'?");

                        if (upsell == true) {
                            var upsellProducts = [];
                            var upsellProduct = products[0];
                            upsellProduct.quantity = 1;

                            upsellProducts.push(upsellProduct);

                            var upsellRequest = {};
                            upsellRequest.shop = shop;
                            upsellRequest.customerEmail = createOrderRequest.customerEmail;
                            upsellRequest.shopifyOrderId = response;
                            upsellRequest.products = upsellProducts;
                            $.ajax({
                                async: false,
                                method: 'POST',
                                url: "https://gateway.ecommerce-wh.com/shopify/checkout/upsell",
                                contentType: "application/json",
                                data: JSON.stringify(upsellRequest)
                            }).done(function(upsellResponse) {
                                console.log("Upsell Done");
                                console.log("ShopifyOrderId: " + upsellResponse);
                            }).fail(function(error) {
                                console.log("Upsell Error: " + JSON.stringify(error));
                            });
                        } else {
                            console.log("Upsell Cancelled");
                            var completeOrderRequest = {};
                            completeOrderRequest.shop = shop;
                            completeOrderRequest.customerEmail = createOrderRequest.customerEmail;
                            completeOrderRequest.shopifyOrderId = response;
                            $.ajax({
                                async: false,
                                method: 'POST',
                                url: "https://gateway.ecommerce-wh.com/shopify/checkout/completeOrder",
                                contentType: "application/json",
                                data: JSON.stringify(completeOrderRequest)
                            }).done(function(completeOrderResponse) {
                                console.log("Complete Order Done");
                                console.log("ShopifyOrderId: " + completeOrderResponse);
                            }).fail(function(error) {
                                console.log("Complete Order Error: " + JSON.stringify(error));
                            });
                        }*/
                    }).fail(function(error) {
                        console.log("Create Order Error: " + JSON.stringify(error));
                    });
                }
            });
        });
    }

  	/* FRONT SCRIPTS */

  	/* Helper cookies functions */
  	function getCookie(cookieName) {
      	var counter;

      	var cookieAttributes = document.cookie.split(';');
      	var numberOfAttributes = cookieAttributes.length;

      	cookieName = cookieName + '=';

      	for (counter = 0; counter < numberOfAttributes; counter++) {
          	var cookieAttribute = cookieAttributes[counter];

          	while (cookieAttribute.charAt(0) === ' ') {
              	cookieAttribute = cookieAttribute.substring(1);
            }

          	if (cookieAttribute.indexOf(cookieName) !== -1) {
              	return cookieAttribute.substring(cookieName.length, cookieAttribute.length);
            }
        }

      	return '';
    };

  	function setCookie(cname, cvalue) {
      	var d = new Date();
      		d.setDate(d.getDate() + 1);
      	var expires = 'expires=' + d.toUTCString();
      	var path = 'path=/';
      	var domain = 'domain=' + window.location.hostname;

      	document.cookie = cname + '=' + cvalue + '; ' + expires + '; ' + domain + '; ' + path;
    }

  function getShippingsMethod(customerZip,country,province) {

      $.ajax({
        async: false,
        method: 'GET',
        url: '/cart/shipping_rates.json?shipping_address%5Bzip%5D='+ customerZip +'&shipping_address%5Bcountry%5D='+ country +'&shipping_address%5Bprovince%5D='+ province
      }).done(function(response) {
        console.log(response.shipping_rates);
        var shippings = response.shipping_rates;
        shippings.forEach(function(element) {
          console.log(element.code);
        });
        console.log(getCookie('cart'));
      }).fail(function(error) {
        console.log("Error: " + JSON.stringify(error));
      });

    }

    function showStep(step) {
      switch(step) {
        case 1:
          $('.main__content').attr('data-current-step', 'contact_information');

          //Set Breadcrumbs position
          $($('.breadcrumb__item')[1]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--current');
          $($('.breadcrumb__item')[2]).removeClass('breadcrumb__item--completed, breadcrumb__item--current');
          $($('.breadcrumb__item')[3]).removeClass('breadcrumb__item--completed, breadcrumb__item--current');
          $($('.breadcrumb__item')[4]).removeClass('breadcrumb__item--completed, breadcrumb__item--current');
          break;
        case 2:
          var address 		= $("#checkout_shipping_address_address1").val();
          var customerZip 	= $("#checkout_shipping_address_zip").val();
          var country 		= $("#checkout_shipping_address_country").val();
          var province 		= $("#checkout_shipping_address_province").val();

          getShippingsMethod(customerZip,country,province);

          $('.main__content').attr('data-current-step', 'shipping_method');

          $($('.breadcrumb__item')[1]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--completed');
          $($('.breadcrumb__item')[2]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--current');
          $($('.breadcrumb__item')[3]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('');
          $($('.breadcrumb__item')[4]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('');
          break;
        case 3:
          $('.main__content').attr('data-current-step', 'payment_method');

          $($('.breadcrumb__item')[1]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--completed');
          $($('.breadcrumb__item')[2]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--completed');
          $($('.breadcrumb__item')[3]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--current');
          $($('.breadcrumb__item')[4]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('');
          break;
        default:
          $('.main__content').attr('data-current-step', 'contact_information');

          $($('.breadcrumb__item')[1]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--completed');
          $($('.breadcrumb__item')[2]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--completed');
          $($('.breadcrumb__item')[3]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--completed');
          $($('.breadcrumb__item')[4]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--current');
      }
    }

  	$( document ).ready(function() {

      	/* Get last step-completed */
      	var msCheckout = getCookie('msCheckout') ? JSON.parse(getCookie('msCheckout')) : undefined;

      	var currentStep;
      	//var lastStepCompleted = msCheckout.lastStepCompleted;

      	if (!msCheckout ) {
          	/* Show First Step */
          	$('.main__content').attr('data-current-step', 'contact_information');

          	currentStep = 1;

          	/* Test setting the cookie value */
          	data = {
              lastStepCompleted: 0
          	}
          	setCookie('msCheckout', JSON.stringify(data));
        } else {
         	var lastStepCompleted = msCheckout.lastStepCompleted;

          	console.log(lastStepCompleted);

            switch(lastStepCompleted) {
              	case 1:
                	//Set forms visibility
                	$('.main__content').attr('data-current-step', 'contact_information');

                	//Set Breadcrumbs position
                	$($('.breadcrumb__item')[1]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--current');
                	$($('.breadcrumb__item')[2]).removeClass('breadcrumb__item--completed, breadcrumb__item--current');
                	$($('.breadcrumb__item')[3]).removeClass('breadcrumb__item--completed, breadcrumb__item--current');
                	$($('.breadcrumb__item')[4]).removeClass('breadcrumb__item--completed, breadcrumb__item--current');
                	break;
              	case 2:
                	$('.main__content').attr('data-current-step', 'shipping_method');

                	$($('.breadcrumb__item')[1]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--completed');
                	$($('.breadcrumb__item')[2]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--current');
                	$($('.breadcrumb__item')[3]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('');
                	$($('.breadcrumb__item')[4]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('');
                	break;
              	case 3:
                	$('.main__content').attr('data-current-step', 'payment_method');

                	$($('.breadcrumb__item')[1]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--completed');
                	$($('.breadcrumb__item')[2]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--completed');
                	$($('.breadcrumb__item')[3]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--current');
                	$($('.breadcrumb__item')[4]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('');
                	break;
              	default:
                	$('.main__content').attr('data-current-step', 'contact_information');

                	$($('.breadcrumb__item')[1]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--completed');
                	$($('.breadcrumb__item')[2]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--completed');
                	$($('.breadcrumb__item')[3]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--completed');
                	$($('.breadcrumb__item')[4]).removeClass('breadcrumb__item--completed, breadcrumb__item--current').addClass('breadcrumb__item--current');
            }
        }

      	/* BreadCrumb Navigation */

      	$('.breadcrumb__item--completed .breadcrumb__link').click(function(){

          	/* Code AFTER validation */
          	//lastStepCompleted = lastStepCompleted + 1;
          	//currentStep = lastStepCompleted;
          	if ($(this).attr('data-step')) {
          		showStep(parseInt($(this).attr('data-step')));
              	currentStep = $(this).attr('data-step');

              	console.log(currentStep);
          	}

      	})

      	/* Button to continue */
      	$('.fn-continueButton').click(function(){
          	showStep(parseInt($(this).attr('data-next-step')));
          	console.log($(this).attr('data-next-step'));

            if(lastStepCompleted < 3){
                lastStepCompleted = lastStepCompleted + 1;
                //currentStep = lastStepCompleted;
                //console.log(currentStep);
            }
      	})

      	/* Inputs styling */
    	$('input[type="text"], input[type="email"], select').on('keyup blur', function(){
          	if ($(this).val()) {
              	$(this).parent().parent().addClass('field--show-floating-label');
              	$(this).parent().parent().find('label').addClass('field__label--visible');
            } else {
              	$(this).parent().parent().removeClass('field--show-floating-label');
              	$(this).parent().parent().find('label').removeClass('field__label--visible');
            }
        });
      	$('input[type="text"], input[type="email"], select').on('focus', function(){
          	$(this).addClass('field--active');
        });
      	$('input[type="text"], input[type="email"], select').on('blur', function(){
          	$(this).removeClass('field--active');
        });
    });


})(jQuery, window);