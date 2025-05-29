const lastTime = "Ex_DailyAuto_LastTime";
const restRid = "12306";
function initPkg_DailyAuto() {
  // <i class="Backpack-newPropTip">获得新道具</i>
  setTimeout(() => {
    daily_main();
  }, 3000);
}
function daily_main() {
  const isInLivingRoom = async () => {
    let a = await mscststs.wait(".BackpackButton", true, (timeout = 50));
    if (!(a === null)) {
      return true;
    }
    return false;
  };
  if (stateControl()) {
    showMessage("【续牌】" + "开始赠送荧光棒", "info");
    fansContinue_auto()
      .then(() => {
        localStorage.setItem(lastTime, new Date());
      })
      .catch(async (err) => {
        if (err == 0) {
          showMessage("【续牌】" + "赠送失败,背包为空", "error");
        } else if (err == -1) {
          showMessage("【续牌】" + "赠送失败,没有荧光棒", "error");
        }
        // 只有进入直播间才能获取荧光棒
        // 当新一天时,打开非直播页面,不会获取荧光棒,此时不要修改lastTime
        if (await isInLivingRoom()) {
          localStorage.setItem(lastTime, new Date());
        } else {
          showMessage("【续牌】" + "赠送失败,请进入直播间", "warning", {
            timeout: 100,
          });
        }
      });
  }
}
// true 需要运行
function stateControl() {
  const checkDateEquals = function (a, b) {
    // date 年月日相同
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };
  let lt = localStorage.getItem(lastTime);
  if (lt) {
    let ltDate = new Date(lt);
    let nowDate = new Date();
    if (checkDateEquals(ltDate, nowDate)) {
      return false;
    } else {
      return true;
    }
  } else {
    //   localStorage.setItem(lastTime, new Date());
    return true;
  }
}

function fansContinue_auto() {
  return new Promise((resolve, reject) => {
    let sendNum = 1;
    let giftId = 0;
    let rid = "12306";
    let restNum = 0;
    getBagGifts(rid, (ret) => {
      let chunkNum = ret.data.list.length;
      if (chunkNum > 0) {
        for (let i = 0; i < chunkNum; i++) {
          if (ret.data.list[i].id == 268) {
            giftId = 268;
            restNum = ret.data.list[i].count;
            break;
          }
          if (ret.data.list[i].id == 2358) {
            giftId = 2358;
            restNum = ret.data.list[i].count;
          }
        }
        if (giftId == 0) {
          showMessage("没有足够的道具", "error");
          reject(-1);
          return;
        }
        fetch("https://www.douyu.com/member/cp/getFansBadgeList", {
          method: "GET",
          mode: "no-cors",
          cache: "default",
          credentials: "include",
        })
          .then((res) => {
            return res.text();
          })
          .then(async (doc) => {
            doc = new DOMParser().parseFromString(doc, "text/html");
            let a =
              doc.getElementsByClassName("fans-badge-list")[0].lastElementChild;
            let n = a.children.length;
            restNum = restNum - n <= 0 ? 0 : restNum - n;
            const promises = [];
            for (let i = 0; i < n; i++) {
              let rid = a.children[i].getAttribute("data-fans-room"); // 获取房间号
              const promise = new Promise((resolve, reject) => {
                sleep(100).then(() => {
                  sendGift_bag(giftId, Number(sendNum), rid)
                    .then((data) => {
                      if (data.msg == "success") {
                        showMessage(
                          "【续牌】" + rid + "赠送荧光棒成功",
                          "success"
                        );
                        resolve();
                        // console.log(rid + "赠送一根荧光棒成功");
                      } else {
                        showMessage(
                          "【续牌】" + rid + "赠送失败 " + data.msg,
                          "error"
                        );
                        // console.log(rid + "赠送失败");
                        console.log(rid, data);
                      }
                    })
                    .catch((err) => {
                      showMessage("【续牌】" + rid + "赠送失败", "error");
                      console.log(rid, err);
                    });
                });
              });
              promises.push(promise);
            }
            Promise.all(promises).then(() => {
              console.log("test-promise all");
              sendGift_bag(giftId, Number(restNum), restRid)
                .then((data) => {
                  if (data.msg == "success") {
                    showMessage(
                      "【剩余全送】" + restRid + "赠送荧光棒成功",
                      "warning",
                      { timeout: 100 }
                    );
                    resolve();
                  } else {
                    showMessage(
                      "【剩余全送】" + restRid + "赠送失败 " + data.msg,
                      "error"
                    );
                  }
                })
                .catch((err) => {
                  showMessage("【剩余全送】" + restRid + "赠送失败", "error");
                });
            });
          })
          .catch((err) => {
            console.log("请求失败!", err);
          });
      } else {
        // showMessage("背包礼物为空", "error");
        reject(0);
        return;
      }
    });
  });
}
