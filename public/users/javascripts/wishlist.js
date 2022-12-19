function addWish(proId) {
    let product = proId
    $.ajax({
        url: "/addwish",
        data: {
            productId: product
        },
        method: "post",
        success: (response) => {
            if (response) {
                alert("response")
            }
        }
    })
}
function removeWish(wishId, proId) {
    $.ajax({
        url: "/removewish",
        data: {
            wish: wishId,
            product: proId
        },
        method: "post",
        success: (response) => {
            if (response.removeProduct) {
                location.reload("#wish")
            }
        }
    })
}
function proDetes(proId) {
    $.ajax({
        url: "/products/details?id=" + proId,
        method: "get",
        success: () => {
            location.href = "/products/details?id=" + proId
        }
    })
}
