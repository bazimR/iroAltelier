var db = require("../config/connection")
var collections = require("../config/collections")
var bcrypt = require('bcrypt')
const { response } = require("express")
const { Db, ObjectId } = require("mongodb")
const { UserBindingContext } = require("twilio/lib/rest/chat/v2/service/user/userBinding")
var objectId = require('mongodb').ObjectId
module.exports = {
    doLogin: (data) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let admin = await db.get().collection(collections.ADMINS_COLLECTION).findOne({ name: data.name })
            if (admin) {
                if (admin.password == data.password) {
                    response.admin = true
                    resolve(response)
                }
                else
                    response.admin = false
                resolve(response)
            }
            else {
                response.admin = false
                resolve(response)
            }
        })
    },
    getAllOrders: () => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.ORDER_COLLECTION).find({status:"Placed"}).sort({ time: -1 }).toArray().then((orders) => {
                // console.log(orders);
                resolve(orders)
            })
        })
    },
    getOrder: (orderId) => {
        console.log("zamzam", orderId);
        return new Promise(async (resolve, reject) => {
            let orderData = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(orderId) }
                },
                {
                    $lookup: {
                        from: collections.USERS_COLLECTIONS,
                        localField: "userId",
                        foreignField: "_id",
                        as: "user"
                    }
                }
                ,
                {
                    $unwind: "$products"
                },
                {
                    $project: {
                        _id: 1,
                        orderDate: 1,
                        orderTime: 1,
                        time: 1,
                        deliveryDetails: 1,
                        paymentMethod: 1,
                        total: 1,
                        status: 1,
                        user: 1,
                        cancelrequest: '$products.cancelrequest',
                        product: '$products.item',
                        quantity: "$products.Qty",
                        status: "$products.status"
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCTS_COLLECTION,
                        localField: "product",
                        foreignField: "_id",
                        as: "products"
                    }
                },
                {
                    $unwind: "$products"
                },
                {
                    $unwind: "$user"
                }
            ]).toArray()
            // console.log("hoooooo");
            // console.log(orderData);
            resolve(orderData)
        })
    },
    cancelItem: (orderId, proId, userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId), "products.item": objectId(proId), userId: objectId(userId) }, {
                    $set: {
                        "products.$.status": "Order canceled"
                    }
                }

                ).then(() => {
                    resolve()
                })
        })
    },
    getTotalOforders: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        _id: objectId(orderId)
                    }
                }
                ,
                {
                    $unwind: "$products"
                },
                {
                    $project: {
                        item: "$products.item",
                        Qty: "$products.Qty"

                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCTS_COLLECTION,
                        localField: "item",
                        foreignField: "_id",
                        as: "product"
                    }
                }
                ,
                {
                    $project: {
                        item: 1,
                        Qty: 1,
                        product: {
                            $arrayElemAt: ["$product", 0]
                        }
                    }
                },
                {
                    $project: {
                        Qty: 1,
                        price: "$product.offerprice"
                    }
                },
                {
                    $addFields: {
                        finalprice: { $toInt: "$price" }
                    }
                }
                ,
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ["$Qty", "$finalprice"] } }
                    }
                }
            ]).toArray()
            resolve(total[0].total)
        })
    },
    dispatch: (orderId, proId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId), "products.item": objectId(proId) }, {
                    $set: {
                        "products.$.status": "Order dispatched"
                    }
                }).then(() => {
                    resolve()
                })
        })
    },
    delayed: (orderId, proId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId), "products.item": objectId(proId) }, {
                    $set: {
                        "products.$.status": "Order delayed"
                    }
                }).then(() => {
                    resolve()
                })
        })
    },
    delivered: (orderId, proId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId), "products.item": objectId(proId) }, {
                    $set: {
                        "products.$.status": "Order delivered"
                    }
                }).then(() => {
                    resolve()
                })
        })
    },
    paymentChart: () => {
        return new Promise(async (resolve, reject) => {
            let details = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $group:
                    {
                        _id: "$paymentMethod",
                        count: { $count: {} }
                    }
                }]).toArray()
            resolve(details)
        })
    },
    amountChart: () => {
        return new Promise(async (resolve, reject) => {
            let details = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $group: {
                        _id: "$paymentMethod",
                        sum: {
                            $sum: "$total"
                        }
                    }
                }
            ]).toArray()
            console.log(details);
            resolve(details)
        })
    },
    addCoupon: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.COUPON_COLLECTION).insertOne(data).then(() => {
                resolve()
            })
        })
    },
    getCoupon: () => {
        return new Promise(async (resolve, reject) => {
            let coupon = await db.get().collection(collections.COUPON_COLLECTION).find().toArray()
            resolve(coupon)
        })
    },
    deleteCoupon: (couponId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collections.COUPON_COLLECTION).deleteOne({ _id: objectId(couponId) }).then(() => {
                resolve()
            })
        })
    },
    addBanner: (bannerDetes) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.BANNER_COLLECTION).insertOne(bannerDetes).then(() => {
                resolve()
            })
        })
    },
    getBanner: () => {
        return new Promise(async (resolve, reject) => {
            let banner = await db.get().collection(collections.BANNER_COLLECTION).find().toArray()
            resolve(banner)

        })
    },
    totalUser: () => {
        return new Promise(async (resolve, reject) => {
            let totalUser = await db.get().collection(collections.USERS_COLLECTIONS).aggregate([{
                $group: {
                    _id: "",
                    total: {
                        $sum: 1
                    }
                }
            }
            ]).toArray()
            resolve(totalUser[0].total)
        })
    },
    totalAmount: () => {
        return new Promise(async (resolve, reject) => {
            let totalAmount = await db.get().collection(collections.ORDER_COLLECTION).aggregate([{
                $group: {
                    _id: "",
                    sum: {
                        $sum: "$total"
                    }
                }
            }]).toArray()
            resolve(totalAmount[0].sum)
        })
    },
    totalProduct: () => {
        return new Promise(async (resolve, reject) => {
            let totalPro = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match:{
                        status:"Placed"
                    }
                },
                {
                $group: {
                    _id: "orders",
                    count: {
                        $sum: 1
                    }
                }
            }]).toArray()
            resolve(totalPro[0].count)
        })
    },
    thisMonth: () => {
        return new Promise(async (resolve, reject) => {
            let newmonth = parseInt(new Date().getMonth()+1)
            let datayear = parseInt(new Date().getFullYear());
            console.log(newmonth);
            console.log("here");
            let thisMonth = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        status: "Placed"
                    }
                },
                {
                    $addFields: {
                        month: {
                            $month: {
                                $dateFromString: {
                                    dateString: "$orderDate",
                                },
                            },
                        },
                        year: {
                            $year: {
                                $dateFromString: {
                                    dateString: "$orderDate",
                                },
                            },
                        },
                    },
                },
                {
                    $match:{
                        year:datayear,
                        month:newmonth
                    }
                },
                {
                    $group:{
                        _id:null,
                        sum:{
                            $sum:1
                        }
                    }
                }
            ]).toArray()
            console.log(thisMonth);
            resolve(thisMonth[0].sum)
        })
    }
}