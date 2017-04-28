function auth_check(callback) {
    if (is_empty(Cookies.get("deepella"))) {
        location.href = "login";
    } else {
        if (callback) callback();
    }
}