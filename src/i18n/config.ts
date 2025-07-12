const zhConfig = {
   
}
const enConfig = {
   
};
export const getBrowserLang = function () {
    let browserLang = navigator.language
        ? navigator.language
        : navigator?.browserLanguage;
    let defaultBrowserLang = "";
    if (
        browserLang.toLowerCase() === "us" ||
        browserLang.toLowerCase() === "en" ||
        browserLang.toLowerCase() === "en_us"
    ) {
        defaultBrowserLang = "en_US";
    } else {
        defaultBrowserLang = "zh_CN";
    }
    return defaultBrowserLang;
};

export const labels = getBrowserLang() === "zh_CN" ? zhConfig : enConfig;
