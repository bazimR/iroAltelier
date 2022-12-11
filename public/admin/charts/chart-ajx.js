
window.onload = function () {
    if ($("#paymentChart")) {
        $.ajax({
            url: "payment-chart",
            method: "get",
            success: (response) => {
                console.log(response);
                const ctx = document.getElementById('paymentChart');
                const data = {
                    labels: response.name,
                    datasets: [{
                        label: 'My First Dataset',
                        data: response.count,
                        backgroundColor: [
                            'rgb(255, 99, 132)',
                            'rgb(54, 162, 235)',
                            'rgb(255, 205, 86)'
                        ],
                        hoverOffset: 4
                    }]
                };
                const config = {
                    type: 'doughnut',
                    data: data,
                };
                new Chart(ctx, config);
            }
        })
    }
    if ($("#amountChart")) {
        $.ajax({
            url: "amount-chart",
            method: "get",
            success: (response) => {
                console.log(response);
                const ctx = document.getElementById('amountChart');
                const data = {
                    labels: response.name,
                    datasets: [{
                        label: "Amount spent",
                        data: response.sum,
                        backgroundColor: [
                            'rgb(255, 99, 132)',
                            'rgb(54, 162, 235)',
                            'rgb(255, 205, 86)'
                        ],
                        hoverOffset: 4
                    }]
                };
                const config = {
                    type: 'bar',
                    data: data,
                };
                new Chart(ctx, config);
            }
        })
    }
    if ($("#totaluser")) {
        $.ajax({
            url: "/admin/totaluser",
            method: "post",
            success: (response) => {
                document.getElementById("value1").innerHTML = response.total
            }
        })
    }
    if ($("#totalamount")) {
        $.ajax({
            url: "/admin/totalamount",
            method: "post",
            success: (response) => {
                document.getElementById("value2").innerHTML = response.sum
            }
        })
    }
    if ($("#totalproduct")) {
        $.ajax({
            url: "/admin/totalproduct",
            method: "post",
            success: (response) => {
                document.getElementById("value3").innerHTML = response.total
            }
        })
    }
    if ($("#thismonth")) {
        $.ajax({
            url: "/admin/thismonth",
            method: "post",
            success: (response) => {
                document.getElementById("value4").innerHTML = response.total
            }
        })
    }
}

