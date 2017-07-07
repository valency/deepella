$(function () {
    var current_year = url_parameter("year");
    if (is_empty(current_year)) url_redirect({year: moment().year()});
    var current_period = url_parameter("period");
    if (is_empty(current_period)) url_redirect({period: moment().year() - (moment().month() > 5 ? 0 : 1)});
    $("#periods").val(current_period);
    for (var i in EVENT_CONF) {
        if (EVENT_CONF.hasOwnProperty(i)) {
            var event_css = event_render(EVENT_CONF[i]);
            $("#legend").append("<span style='" + event_css[0] + ":" + event_css[1] + ";'>" + EVENT_CONF[i]["name"] + "</span> ");
        }
    }
    $("#calc-start").html(moment({year: current_period, month: 6, day: 1}).format("YYYY-MM-DD"));
    $("#calc-end").html(moment({year: parseInt(current_period) + 1, month: 5, day: 30}).format("YYYY-MM-DD"));
    var username = url_parameter("u");
    var password = url_parameter("p");
    if (is_empty(username) || is_empty(password)) {
        username = "";
        bootbox.prompt("请输入访问密码：", function (data) {
            data = data.split("-");
            if (data.length === 2 && check_password(data[0], data[1])) {
                url_redirect({u: data[0], p: data[1]});
            }
        });
    } else {
        check_password(username, password);
    }
    $.get(API_SERVER + "events/?user=" + username + "&start=" + $("#calc-start").html() + "&end=" + $("#calc-end").html(), function (data) {
        var day_off = 0;
        var overtime = 0;
        for (var i = 0; i < data.length; i++) {
            data[i]["startDate"] = new Date(data[i]["startDate"]);
            data[i]["endDate"] = new Date(data[i]["endDate"]);
            if (data[i]["user"] === username) {
                if (data[i]["type"] === "day_off") day_off++;
                else if (data[i]["type"] === "day_off_half") day_off += 0.5;
                else if (data[i]["type"] === "overtime") overtime++;
                else if (data[i]["type"] === "overtime_half") overtime += 0.5;
            }
        }
        $("#calc-day-off").html(day_off);
        $("#calc-overtime").html(overtime);
        var container = $("#calendar");
        container.calendar({
            dataSource: data,
            enableContextMenu: true,
            enableRangeSelection: true,
            style: "custom",
            startYear: current_year,
            customDataSourceRenderer: function (element, date, events) {
                for (var i = 0; i < events.length; i++) {
                    var event = events[i];
                    var event_conf = EVENT_CONF[event["type"]];
                    var event_css = event_render(event_conf);
                    $(element).css(event_css[0], event_css[1]);
                }
            }, renderEnd: function (e) {
                if (e.currentYear.toString() !== current_year.toString()) url_redirect({year: e.currentYear});
            }
        });
    });
    $.get(API_SERVER + "users/", function (data) {
        for (var i = 0; i < data.length; i++) {
            var user = data[i];
            $("#users").append("<option value='" + user["username"] + "'>" + user["name"] + "</option>");
            if (username === user["username"]) {
                $("#user-username").html(user["username"]);
                $("#user-name").html(user["name"]);
                $("#user-group").html(USER_GROUP[user["group"]]["name"]);
            }
        }
        init_widget();
    });
});

function event_render(event_conf) {
    if (event_conf["style"] === "border") return ["box-shadow", event_conf["color"] + " 0 -4px 0 0 inset"];
    else if (event_conf["style"] === "background") return ["background", event_conf["color"]];
}

function period_switch() {
    bootbox.prompt("需要显示哪一年度？", function (data) {
        if (data) url_redirect({period: data})
    });
}

function check_password(username, password) {
    var challenge = CryptoJS.SHA1(username).toString().substring(0, 6);
    if (password === challenge) return true;
    else {
        bootbox.alert(error_message("身份无法识别！"), function () {
            location.reload();
        });
    }
}
