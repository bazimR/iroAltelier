
function addToCart(proId) {
    $.ajax({
        url: "/addtocart/" + proId,
        method: "get",
        success: function (response) {
            if (response.status) {
                let count = $("#cartcount").html()
                count = parseInt(count).html(count)
            }
        }
    });
}
function changeQuantity(cartId, proId, value) {
    let Qty = parseInt(document.getElementById(proId).innerHTML)
    let stock = parseInt(document.getElementById("stock").innerText)
    value = parseInt(value)
    $.ajax({
        url: '/change-quantity',
        data: {
            cart: cartId,
            product: proId,
            value: value,
            Qty: Qty,
            stock: stock
        },
        method: "post",
        success: (response) => {
            if (response.removeProduct) {
                alert("Product has been removed")
                $('#mydivmain').load(location.href + " #mydivmain")
                $("#mydiv1").load(location.href + " #mydiv1");
                $("#total").load(location.href + " #total");
                $("#stock").load(location.href + " #stock");
            }
            else if(response.outOfStock)
            {
                alert("product out of stock");
            }
            else {
                document.getElementById(proId).innerHTML = Qty + value
                $("#mydiv1").load(location.href + " #mydiv1");
                $("#total").load(location.href + " #total");
                $("#stock").load(location.href + " #stock");
            }
        }
    })
}
function deleteProduct(cartId, proId) {
    let Qty = parseInt(document.getElementById(proId).innerHTML)
    $.ajax({
        url: '/delete-product',
        data: {
            cart: cartId,
            product: proId,
            Qty: Qty
        },
        method: "post",
        success: (response) => {
            if (response.removeProduct) {
                alert("Product has been removed")
                $('#mydivmain').load(location.href + " #mydivmain")
                $("#mydiv1").load(location.href + " #mydiv1");
                $("#total").load(location.href + " #total");
            }

        }
    })
}
$("#addAddress").submit((e) => {
    e.preventDefault()
    $.ajax({
        url: "/addAddress",
        method: "post",
        data: $("#addAddress").serialize(),
        success: (response) => {
            if (response.addAddress) {
                alert("New address added!")
                location.reload()
            }
        }
    })
})
function requestCancel(orderId, userId, proId) {
    let paymentmethod = document.getElementById("payment1").innerText
    let total = document.getElementById("price1" + proId).innerText
    $.ajax({
        url: "/request-cancel",
        data: {
            total: total,
            payment: paymentmethod,
            order: orderId,
            user: userId,
            product: proId
        },
        method: "post",
        success: (response) => {
            if (response.request) {
                alert("Cancellation requested")
                location.reload()
            }
        }
    })
}
function applyCoupon() {
    document.getElementById("coupon").readOnly = false;
    document.getElementById("apply").disabled = false;
    let coupon = document.getElementById("coupon").value
    $.ajax({
        url: '/coupon-apply',
        data: {
            coupon
        },
        method: "post",
        success: (response) => {
            if (response.status) {
                let total = document.getElementById("total").innerText
                total = parseInt(total)
                let min = parseInt(response.data.minamount)
                let percentage = parseInt(response.data.percentage)
                let max = parseInt(response.data.maxamount)
                if (min > total) {
                    alert("minimum ammount should be " + response.data.minamount)
                }
                else {
                    document.getElementById("coupon").readOnly = true;
                    document.getElementById("apply").disabled = true;
                    var discounted = Math.round((total * percentage) / 100);
                    if (discounted > max) {
                        document.getElementById("total").innerText = total - max
                        $.ajax({
                            url: "/assign-coupon",
                            data: {
                                total: document.getElementById("total").innerText,
                                id: response.data._id,
                            },
                            method: "post",
                            success: (response) => {
                                if (response.status) {
                                    alert("Congrats!,Coupon applied");
                                }
                                else {
                                    alert("Invalid Coupon")
                                }
                            },
                        });
                    }
                    else {
                        document.getElementById("total").innerText = total - Math.round((total * percentage) / 100)
                        $.ajax({
                            url: "/assign-coupon",
                            data: {
                                total: document.getElementById("total").innerText,
                                id: response.data._id,
                            },
                            method: "post",
                            success: (response) => {
                                if (response.status) {
                                    alert("Congrats!,Coupon applied");
                                }
                                else {
                                    alert("Invalid Coupon")
                                }
                            },
                        });
                    }
                }
            }
            else {
                alert("Coupon Invalid")
            }
        }
    })
}
