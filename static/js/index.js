$(function () {
    console.log("自动填满本年度所有双休日：fill_weekends(6,2017);fill_weekends(7,2017);");
    for (var i in EVENT_CONF) {
        if (EVENT_CONF.hasOwnProperty(i)) {
            var event_css = event_render(EVENT_CONF[i]);
            $("#legend").append("<span style='" + event_css[0] + ":" + event_css[1] + ";'>" + EVENT_CONF[i]["name"] + "</span> ");
        }
    }
    $("#calc-start").html(moment({year: moment().startOf("year").year() - 1, month: 6, day: 1}).format("YYYY-MM-DD"));
    $("#calc-end").html(moment({year: moment().startOf("year").year(), month: 5, day: 30}).format("YYYY-MM-DD"));
    var username = url_parameter("u");
    if (is_empty(username)) {
        username = "";
        bootbox.alert(warning_message("没有选择员工，请选择员工后再操作。"));
    }
    $.get(API_SERVER + "events/?user=" + username + "&start=" + $("#calc-start").html() + "&end=" + $("#calc-end").html(), function (data) {
        var day_off = 0;
        var overtime = 0;
        for (var i = 0; i < data.length; i++) {
            data[i]["startDate"] = new Date(data[i]["startDate"]);
            data[i]["endDate"] = new Date(data[i]["endDate"]);
            if (data[i]["user"] === username) {
                if (data[i]["type"] === "day_off") day_off++;
                else if (data[i]["type"] === "overtime") overtime++;
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
            customDataSourceRenderer: function (element, date, events) {
                for (var i = 0; i < events.length; i++) {
                    var event = events[i];
                    var event_conf = EVENT_CONF[event["type"]];
                    var event_css = event_render(event_conf);
                    $(element).css(event_css[0], event_css[1]);
                }
            }, selectRange: function (e) {
                var html = "<p>选定日期：<code>" + moment(e.startDate).format("YYYY-MM-DD") + "</code> - <code>" + moment(e.endDate).format("YYYY-MM-DD") + "</code></p>";
                html += "<select id='event_add_type' class='form-control'>";
                for (var i in EVENT_CONF) {
                    if (EVENT_CONF.hasOwnProperty(i)) {
                        html += "<option value='" + i + "'>";
                        html += EVENT_CONF[i]["name"];
                        if (EVENT_CONF[i]["user_mode"]) html += "（" + $("#user-name").html() + "）";
                        html += "</option>";
                    }
                }
                html += "</select>";
                bootbox.dialog({
                    title: "新增标记",
                    message: html,
                    buttons: {
                        OK: function () {
                            var event_type = $("#event_add_type").val();
                            var event = {
                                name: EVENT_CONF[event_type]["name"],
                                startDate: e.startDate,
                                endDate: e.endDate,
                                type: event_type
                            };
                            if (EVENT_CONF[event_type]["user_mode"]) {
                                if (is_empty(username)) {
                                    bootbox.alert(warning_message("没有选择员工，请选择员工后再操作。"));
                                } else {
                                    event["user"] = username;
                                    $.post(API_SERVER + "event/", event, function () {
                                        location.reload();
                                    });
                                }
                            } else {
                                $.post(API_SERVER + "event/", event, function () {
                                    location.reload();
                                });
                            }
                        }
                    }
                });
            }, contextMenuItems: [{
                text: 'Delete',
                click: function (event) {
                    loading_dialog();
                    $.ajax({
                        type: "DELETE",
                        url: API_SERVER + "event/",
                        data: {
                            id: event.id
                        }, success: function () {
                            location.reload();
                        }, error: function () {
                            bootbox.hideAll();
                            bootbox.alert(error_message("删除失败！请联系开发人员。"), function () {
                                location.reload();
                            });
                        }
                    });
                }
            }]
        });
    });
    $.get(API_SERVER + "users/", function (data) {
        for (var i = 0; i < data.length; i++) {
            var user = data[i];
            $("#users").append("<option value='" + user["username"] + "'>" + user["name"] + "</option>");
            if (username === user["username"]) {
                $("#user-username").html(user["username"]);
                $("#user-name").html(user["name"]);
            }
        }
    });
});

function fill_weekends(weekday, year) {
    if (is_empty(year)) year = moment().year();
    bootbox.hideAll();
    bootbox.dialog({
        message: "是否确定要自动填满本年度所有双休日？该操作无法恢复！",
        buttons: {
            ok: {
                label: "确定",
                className: "btn-primary",
                callback: function () {
                    loading_dialog();
                    var start = moment({year: year, month: 0, day: 1}).day(weekday);
                    var end = moment({year: year, month: 11, day: 31}).day(weekday);
                    var result = [];
                    var current = start.clone();
                    while (current.isBefore(end)) {
                        result.push({
                            name: EVENT_CONF["holiday"]["name"],
                            startDate: current.clone(),
                            endDate: current.clone(),
                            type: "holiday"
                        });
                        current = current.add(7, 'days');
                    }
                    $.post(API_SERVER + "events/", {
                        events: JSON.stringify(result)
                    }, function () {
                        location.reload();
                    });
                }
            }, cancel: {
                label: "取消",
                className: "btn-default"
            }
        }
    });
}

function user_create() {
    var html = "<div class='form-group'>";
    html += "<input id='user-create-username' class='form-control' placeholder='员工用户名，命名规则为 jlzhou = 周婕纶'/>";
    html += "</div><div class='form-group'>";
    html += "<input id='user-create-name' class='form-control' placeholder='员工姓名'/>";
    html += "</div>";
    bootbox.dialog({
        title: "创建新员工",
        message: html,
        buttons: {
            OK: function () {
                var user = {
                    username: $("#user-create-username").val(),
                    name: $("#user-create-name").val()
                };
                $.post(API_SERVER + "user/", user, function () {
                    location.reload();
                });
            }
        }
    });
}

function user_switch() {
    url_redirect({u: $("select#users").val()})
}

function user_delete() {
    var user_select = $("select#users");
    bootbox.dialog({
        title: "删除员工",
        message: "<p>确定要删除此员工？该操作无法恢复！</p><p><code>" + user_select.val() + "</code> " + user_select.children("option:selected").text() + "</p>",
        buttons: {
            "确定": function () {
                $.ajax({
                    type: "DELETE",
                    url: API_SERVER + "user/",
                    data: {
                        username: user_select.val()
                    }, success: function () {
                        location.reload();
                    }, error: function () {
                        bootbox.hideAll();
                        bootbox.alert(error_message("删除失败！请联系开发人员。"), function () {
                            location.reload();
                        });
                    }
                });
            }
        }
    });
}

function event_render(event_conf) {
    if (event_conf["style"] === "border") return ["box-shadow", event_conf["color"] + " 0 -4px 0 0 inset"];
    else if (event_conf["style"] === "background") return ["background", event_conf["color"]];
}