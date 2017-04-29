var emoji = ["╮(╯▽╰)╭", "!!!∑(ﾟДﾟノ)ノ", "o(´^｀)o", "(￣ェ￣;)", "〒▽〒", "ㄟ( ▔, ▔ )ㄏ", "_(:3」∠❀)_"];

$(function () {
    $("#password").enter(function () {
        var p = $("#password").val();
        $.get(API_SERVER + "auth/?p=" + p, function (data) {
            if (data["status"]) {
                Cookies.set("deepella", p);
                location.href = "index";
            } else {
                $("#password").val(emoji.randomItem());
            }
        });
    });
});