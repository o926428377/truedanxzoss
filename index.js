function distance(lon1, lat1, shop_info) {
    var lon2 = shop_info[6];
    var lat2 = shop_info[5];
    var R = 6371; // Radius of the earth in km
    var dLat = (lat2-lat1).toRad();  // Javascript functions in radians
    var dLon = (lon2-lon1).toRad(); 
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
}

if (typeof(Number.prototype.toRad) === "undefined") {
    Number.prototype.toRad = function() {
      return this * Math.PI / 180;
    }
}

if (!String.prototype.format) {
    String.prototype.format = function(dict) {
      return this.replace(/{(\w+)}/g, function(match, key) {
        return typeof dict[key] !== 'undefined'
          ? dict[key]
          : match
        ;
      });
    };
}

function sendPost(url, _params) {
    if (data.test_mode) {
        return new Promise(function(resolve,reject) {
            var result = {
                "status": true,
                "msg": null,
                "product": "黑糖珍珠鮮奶",
                "status_text": "有效兌換券",
                "quantity": 1,
                "price": 0,
            };
            resolve(result);
        })
    }
	var form = document.createElement("form");
	form.setAttribute("method", "post");
	form.setAttribute("action", url);
	for (var key in _params) {
		var hiddenField = document.createElement("input");
		hiddenField.setAttribute("type", "hidden");
		hiddenField.setAttribute("name", key);
		hiddenField.setAttribute("value", _params[key]);
		form.appendChild(hiddenField);
	}
	var hiddenSubmit = document.createElement("input");
	hiddenSubmit.setAttribute("type", "submit");
	hiddenSubmit.setAttribute("style", "display:none;");
	form.appendChild(hiddenSubmit);
	document.body.appendChild(form);
	return new Promise(function(resolve,reject){
		$.post(url, _params).done(function(data){
			if (data.length>0 || Object.keys(data).length>0){
				resolve(data);
			}  else {
				reject('Error!');
			}
		}).fail(function(xhr, status, error) {
            reject(error    );
        });
	})
};

var redeem_template = '<div class="container p-3 justify-content-center text-center">'+
"<div class='modalWrapper' id='camera_div' v-if='!destroyed'>"+
"<div class='overlay checkout' @click='turnCameraOff()'></div>"+
"<div class='modal checkout'>"+
"<i class='close fa fa-times' @click='turnCameraOff()'></i>"+
"<qrcode-stream :camera='camera' @decode='onDecode' @init='onInit' v-if='!destroyed'>"+
"<div class='loading-indicator' v-if='loading'>相機開啟中...</div>"+
"</qrcode-stream>"+
"</div></div>"+
'<div class="p-2">' +
'<img class="card-img-top" src="ZOSS_logo.png" style="object-fit: cover;width: 100px;"></img>'+
'<span> X </span>' +
'<img class="card-img-top" src="truedan.png" style="object-fit: cover;width: 100px;"></img>'+
'<h2 slot="title" class="text-info p-2" style="position:relative;" v-if="tartget_shop">{{ all_shops_dict[target_city][\'shops\'][tartget_shop].shop_name }}</h2>' +
'</div>' +
'<div class="p-2">' +
'<select name="s_city" @change="tartget_shop=\'\';" v-model="target_city" :disabled="lock">' +
'<option value="">請選擇地區</option>' +
'<option v-for="(city, city_id, index) in all_shops_dict" :value="city_id">{{ city.city_name }}</option>'+
'</select>' +
'</div>' +
'<div class="p-2">'+
'<select name="s_shop" v-model="tartget_shop" @change="turnCameraOn()" :disabled="lock">' +
'<option value="">請選擇分店</option>' +
'<option v-for="(shop, shop_k, index_sub) in (target_city===\'\'?[]:all_shops_dict[target_city][\'shops\'])" :value="shop.shop_tel" v-if="target_city">{{ shop.shop_name }}</option>'+
'</select>' +
'</div>' +
'<div class="p-2">'+
'<button class="btn btn-secondary" @click="turnCameraOn()" v-if="tartget_shop">掃描 QRCODE</button>' +
'</div>' +
'</div>';

Vue.component('zp_redeem', {
    template:redeem_template,
    props: ['all_shops', 'all_shops_dict'],
    data: function() {
        return {
            qrcode:"",
            target_city: "",
            tartget_shop:"",
            isValid: undefined,
            destroyed: true,
            camera: 'auto',
            loading: false,
            lock: false,
        }
    },
    filters: {
        no_data: function(str) {
            return str?str:"-" ;
        },
    },
    methods: {
        onChangeRegion: function (event) {
            console.log(this.region);
            console.log(event.target.value);
            if (this.region === event.target.value) {
                this.region = "";
                $("#"+event.target.id)[0].checked = false;
            } else {
                this.region = event.target.value;
            }
        },
        async onInit (promise) {
            this.loading = true
            try {
                await promise
            } catch (error) {
                console.error(error)
            } finally {
                //this.resetValidationState
                this.isValid = undefined
                this.loading = false
            }
          },
        turnCameraOn () {
            this.isValid = undefined
            this.destroyed = false
            this.camera = 'auto'
        },
        turnCameraOff () {
            this.camera = 'off'
            this.destroyed = true
        },
        async onDecode (content) {
            var self = this;
            self.result = content
            self.camera = 'off'
            var count = 0
            while (self.result===null && count<=6) {
               await this.timeout(500)
               count += 1
            }
            if (self.result===null || self.result==='') {
                self.turnCameraOn()
                return
            }
            var post_body = {"shop":self.tartget_shop, "qrcode":self.result}
            sendPost(data.post_url ,post_body).then(function (checkResult) {
                var msg;
                if (checkResult.status === true) {
                    msg = "<div style='align-content: center;display:inline-block;'><div style=\"text-align: left\"><span>分店：{shop_name}</span><br><span>產品名稱：{product}</span><br><span>狀態：{status_text}</span><br><span>數量：{quantity}</span><br><span>金額：{price}</span></div></div>".format({shop_name:self.all_shops_dict[self.target_city]['shops'][self.tartget_shop].shop_name, ...checkResult});
                    var sf_conig = {
                          title: '驗證成功',
                          width: '38em',
                          html: msg,
                          icon: 'success',
                          showCancelButton: true,
                          confirmButtonColor: '#3085d6',
                          cancelButtonColor: '#d33',
                          confirmButtonText: '兌換',
                          cancelButtonText: '重新掃描'
                    };
                    Swal.fire(sf_conig).then((result) => {
                          if (result.isConfirmed || result.isDenied) {
                            self.turnCameraOff();
                            Swal.fire({
                                showCloseButton: true,
                                showConfirmButton: false,
                                html: '<div><sapn class="badge bg-info rounded-pill text-light px-5 py-2 fs-2">兌換完成</span></div>'+
                                '<div class="p-2"><img class="card-img-top" src="ZOSS_logo.png" style="object-fit: cover;width: 150;"></img></div>'+
                                '<div class="p-2"><img class="card-img-top" src="truedan_big.png" style="object-fit: cover;width: 150;"></img></div>'+
                                '<div class="p-3"><sapn class="text-decoration-underline">歡迎再次光臨</span></div>',
                            })
                          } else {
                            self.turnCameraOn();
                          }
                        })
                } else {
                    Swal.fire({
                        title: '無法兌換',
                        text: checkResult.msg,
                        icon: "warning",
                    }).then(function(){
                            self.turnCameraOn();
                        });
                }
    
            }).catch(function (error) {
                Swal.fire({
                    title: '無效票券，請重新掃描',
                    text: content,
                    icon: "error",
                    timer: 1500
                }).then(function(){
                    self.turnCameraOn();
                });
            });
        },
        sort_by_position() {
            var self = this;
            window.navigator.geolocation.getCurrentPosition(function(pos) {
                console.log(pos);
                var lon = pos.coords.longitude;
                var lat = pos.coords.latitude;
                self.shop_list.sort(function(a, b) {
                    return distance(lon, lat, a) - distance(lon, lat, b);
                });
                self.show_sort_btn = false
            }, function(err) {}, {maximumAge:0, timeout:10000, enableHighAccuracy: false});
        },
    },
    mounted () {
        var self = this;
        loading.isLoading = false;
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const target_city = urlParams.get('target_city') || null;
        const tartget_shop = urlParams.get('tartget_shop') || null;
        if (target_city && tartget_shop) {
            self.target_city = target_city;
            self.tartget_shop = tartget_shop;
            self.lock = true;
            self.turnCameraOn();
        }
        // $('#top-menu > * > a').attr("target", "_blank");
        // $('#main-header > div.container.clearfix.et_menu_container > div.logo_container > a').attr("target", "_blank");
    },
    created () {
        // console.log(true);
    }
});


Vue.use(VueLoading);
Vue.component('loading', VueLoading)

var loading = new Vue({
    el: "#loading",
    data: {isLoading: false}
});

var designer_price = {};
var vue_export = new Vue({
    el: "#vue",
    data: data,
});
