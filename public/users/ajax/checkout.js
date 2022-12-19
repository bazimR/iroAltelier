
$("#payment-form").submit((e) => {
    e.preventDefault()
    $.ajax({
        url: '/place-order',
        method: 'post',
        data: $('#payment-form').serialize(),
        success: (response) => {
            if (response.COD) {
                location.href = '/thank-you'
            }
            else if (response.RAZORPAY) {
                razorPayPayment(response)
            }
            else {
                location.href = response.href
            }
        }
    })
})
function razorPayPayment(order) {
    var options = {
        "key": 'rzp_test_l39HCRVxVJH4hM', // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Iro altelier",
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response) {
            verifyPayment(response, order)
        },
        "callback_url": "https://eneqd3r9zrjok.x.pipedream.net/",
        "prefill": {
            "name": "Gaurav Kumar",
            "email": "gaurav.kumar@example.com",
            "contact": "9999999999"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#717fe0"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.on('payment.failed', function (response) {
        location.href="/payment-failed"
    });
    rzp1.open();

}
function verifyPayment(payment, order) {
    $.ajax({
        url: "/verify-payment",
        data: {
            payment,
            order
        },
        method: "post",
        success: (response) => {
            if (response.status) {
                location.href = '/thank-you'
            }
            else {
                alert("payment failed")
            }
        }
    })
}