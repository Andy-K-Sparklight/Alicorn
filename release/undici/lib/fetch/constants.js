"use strict";const forbiddenHeaderNames=["accept-charset","accept-encoding","access-control-request-headers","access-control-request-method","connection","content-length","cookie","cookie2","date","dnt","expect","host","keep-alive","origin","referer","te","trailer","transfer-encoding","upgrade","via"],corsSafeListedMethods=["GET","HEAD","POST"],nullBodyStatus=[101,204,205,304],redirectStatus=[301,302,303,307,308],referrerPolicy=["","no-referrer","no-referrer-when-downgrade","same-origin","origin","strict-origin","origin-when-cross-origin","strict-origin-when-cross-origin","unsafe-url"],requestRedirect=["follow","manual","error"],safeMethods=["GET","HEAD","OPTIONS","TRACE"],requestMode=["navigate","same-origin","no-cors","cors"],requestCredentials=["omit","same-origin","include"],requestCache=["default","no-store","reload","no-cache","force-cache","only-if-cached"],forbiddenResponseHeaderNames=["set-cookie","set-cookie2"],requestBodyHeader=["content-encoding","content-language","content-location","content-type"],forbiddenMethods=["CONNECT","TRACE","TRACK"],subresource=["audio","audioworklet","font","image","manifest","paintworklet","script","style","track","video","xslt",""];module.exports={subresource,forbiddenResponseHeaderNames,forbiddenMethods,requestBodyHeader,referrerPolicy,requestRedirect,requestMode,requestCredentials,requestCache,forbiddenHeaderNames,redirectStatus,corsSafeListedMethods,nullBodyStatus,safeMethods};