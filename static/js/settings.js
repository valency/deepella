const API_SERVER = "/deepella/api/";

const EVENT_CONF = {
    day_off: {
        name: "请假（全天）",
        color: "#FCDB82",
        style: "background",
        user_mode: true
    }, overtime: {
        name: "加班（全天）",
        color: "#C9EE61",
        style: "background",
        user_mode: true
    }, day_off_half: {
        name: "请假（半天）",
        color: "#EBEEB7",
        style: "background",
        user_mode: true
    }, overtime_half: {
        name: "加班（半天）",
        color: "#A4F9BA",
        style: "background",
        user_mode: true
    }, holiday: {
        name: "法定节假日",
        color: "#D43F3A",
        style: "border",
        user_mode: false
    }, holiday_as_workday: {
        name: "法定补假日",
        color: "#4CAE4C",
        style: "border",
        user_mode: false
    }
};

const USER_GROUP = {
    1: {
        name: "内地假日组",
        hint: "节假日可以随意更改"
    }, 2: {
        name: "周末假日组",
        hint: "节假日仅限双休日"
    }
};

const EMOJI = ["╮(╯▽╰)╭", "!!!∑(ﾟДﾟノ)ノ", "o(´^｀)o", "(￣ェ￣;)", "〒▽〒", "ㄟ( ▔, ▔ )ㄏ", "_(:3」∠❀)_"];