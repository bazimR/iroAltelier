function cancel(orderId, userId, proId) {
    $.ajax({
        url: "/admin/cancel",
        data: {
            order: orderId,
            user: userId,
            product:proId
        },
        method: "post",
        success: (response) => {
            if(response.cancel){
                alert("order cancelled!!")
                location.reload()
            }
        }
    })
}
function dispatch(orderId, userId, proId) {
    $.ajax({
        url: "/admin/dispatch",
        data: {
            order: orderId,
            user: userId,
            product:proId
        },
        method: "post",
        success: (response) => {
            if(response.dispatch){
                alert("order dispatch!!")
                location.reload()
            }
        }
    })
}
function delayed(orderId, userId, proId) {
    $.ajax({
        url: "/admin/delayed",
        data: {
            order: orderId,
            user: userId,
            product:proId
        },
        method: "post",
        success: (response) => {
            if(response.delayed){
                alert("order delayed!!")
                location.reload()
            }
        }
    })
}
function delivered(orderId, userId, proId) {
    $.ajax({
        url: "/admin/delivered",
        data: {
            order: orderId,
            user: userId,
            product:proId
        },
        method: "post",
        success: (response) => {
            if(response.delivered){
                alert("order delivered!!")
                location.reload()
            }
        }
    })
}