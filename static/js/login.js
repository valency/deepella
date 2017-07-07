$(function () {
    $("#password").enter(function () {
        var p = $("#password").val();
        $.get(API_SERVER + "auth/?p=" + p, function (data) {
            if (data["status"]) {
                Cookies.set("deepella", p);
                location.href = "index";
            } else {
                $("#password").val(EMOJI.randomItem());
            }
        });
    });
});