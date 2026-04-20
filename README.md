# [Simple Modify Headers - Extended](https://github.com/warren-bank/crx-simple-modify-headers/tree/extended)

## Forked from

[SimpleModifyHeaders](https://github.com/didierfred/SimpleModifyHeaders)

* version: [1.6.7](https://github.com/didierfred/SimpleModifyHeaders/releases/tag/v1.6.7)
* commit: [ea11a7a](https://github.com/didierfred/SimpleModifyHeaders/tree/ea11a7a52c7e6701f151bae3665cf455b26b94f2)
* date: 2020-08-31

## Summary of [changes](https://github.com/warren-bank/crx-simple-modify-headers/compare/smh-extended/v1.6.7..extended)

* Configuration:
  - "URL Pattern" _field_ is removed
    * previously:
      - held a ["match pattern"](https://developer.chrome.com/extensions/match_patterns)
      - was used to restrict access by the extension only to matching HTTP traffic
    * now:
      - the rules table is applied to all HTTP traffic
  - "Filter URL per rules" _setting_ is removed
  - "When URL contains" _field_
    * previously:
      - was active only when the "Filter URL per rules" _setting_ was enabled
      - held a string
      - was used to restrict the modification performed by the associated rule to only those URLs that contain the exact substring
    * now:
      - is always active
      - holds a case-insensitive [regular expression](https://perldoc.perl.org/perlre) pattern
      - is used to restrict the modification performed by the associated rule to only those URLs that match the regex pattern
      - can be left empty to inherit its value from the closest previous rule that does contain a regex pattern
  - "Header Field Name" _field_ can optionally be chosen from a list of common values
  - "Header Field Name" _field_ can fuzzy match substrings in "delete" rules by ending with the "*" character
  - "Rule Set" feature is added
    * info:
      - a "Rule Set" is a named sets of rules
      - each "Rule Set" can be turned on/off as a unit
    * "Add" _button_:
      - dynamically adds a new "Rule Set"
    * _dropdown_ field:
      - changes the currently selected "Rule Set"
  - "Export" _button_ writes rules to an external JSON text file
    * now:
      - JSON schema has been changed to support the "Rule Set" feature
  - "Import" _button_ reads rules from an external JSON text file
    * previously:
      - imported rules:
        * __replaced__ all of the pre-existing rules
    * now:
      - imported rules:
        * __appends__ to "Rule Sets" that already exist
        * __adds__ "Rule Sets" that do not yet exist
  - "Delete All" _button_ is added
    * when clicked, gives the following options:
      1. All rule sets
      2. Current rule set
      3. All lines in current rule set
  - "Parameters" _button_ is renamed to "Settings"
* Popup window:
  - _dropdown_ field:
     * select one or more "Rule Sets"
  - "Start" _button_
     * enables the selected "Rule Sets" globally, in all browser tabs
  - "Start Tab" _button_
     * enables the selected "Rule Sets" in only the current browser tab
     * this feature is only available when no "Rule Sets" are globally enabled
* Automatic behavior:
  1. always replace `x-simple-modify-headers-${name}` request headers with `${name}`
     - conditions:
       * the extension is either enabled globally, or enabled for the current browser tab
     - purpose:
       * to allow Javascript network requests (ex: XHR, fetch) to add/modify [forbidden request headers](https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_request_header)
     - implications:
       * the presence of these custom HTTP request headers will trigger a [CORS preflight OPTIONS request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request)
     - example:
       ```javascript
         // specify the "Referer" request header:
         fetch(
           'http://httpbin.org/headers',
           {headers: {"x-simple-modify-headers-referer": "http://foo.bar.example.com/baz"}}
         )
         .then(res => res.json())
         .then(console.log)
       ```
  2. add request headers embedded into the value of the headers: [`Accept`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept), [`Accept-Language`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Accept-Language), [`Content-Language`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Language)
     - format of value:
       * `,` separated list of `SMH;${encoded_name}=${encoded_value}`
       * `encoded_name` can be encoded in either of the following ways:
         1. as an integer,<br>which is effectively an enumeration that includes the names of all forbidden request headers
         2. base64 encoded
       * `encoded_value` is always base64 encoded
       * the base64 encoding uses a custom alphabet:
         - `+` is replaced by: `-`
         - `/` is replaced by: `*`
     - conditions:
       * the extension is either enabled globally, or enabled for the current browser tab
     - purpose:
       * to allow Javascript network requests (ex: XHR, fetch) to add/modify [forbidden request headers](https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_request_header)
     - implications:
       * the presence of these [CORS safelisted HTTP request headers](https://developer.mozilla.org/en-US/docs/Glossary/CORS-safelisted_request_header) will _NOT_ trigger a [CORS preflight OPTIONS request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request), when the length of the value is &lt;= 128 characters
     - example &num;1:
       ```javascript
         const enum_forbidden_header_names = ["accept-charset", "accept-encoding", "access-control-request-headers", "access-control-request-method", "access-control-request-private-network", "connection", "content-length", "cookie", "date", "dnt", "expect", "host", "keep-alive", "origin", "referer", "set-cookie", "te", "trailer", "transfer-encoding", "upgrade", "user-agent", "via", "x-http-method", "x-http-method-override", "x-method-override"]

         const encode_name = (name) => enum_forbidden_header_names.indexOf(name.toLowerCase())
         const encode_value = (val) => btoa(val).replace(/=+$/, '').replace(/[\+]/g, '-').replace(/[\/]/g, '*')

         const cors_safelisted_header_values = []
         cors_safelisted_header_values.push("en-US")
         cors_safelisted_header_values.push("SMH;" + encode_name("origin")  + "=" + encode_value("https://www.example.com"))
         cors_safelisted_header_values.push("SMH;" + encode_name("referer") + "=" + encode_value("https://foo.example.com/bar"))
         cors_safelisted_header_values.push("SMH;" + encode_value("x-foo")  + "=" + encode_value("bar"))

         const headers = {}
         headers["content-language"] = cors_safelisted_header_values.join(',')

         fetch('http://httpbin.org/headers', {headers})
         .then(res => res.json())
         .then(console.log)
       ```
     - example &num;2:
       ```javascript
         const encode_value = (val) => btoa(val).replace(/=+$/, '').replace(/[\+]/g, '-').replace(/[\/]/g, '*')

         const headers = new Headers()
         headers.append("content-language", "en-US")
         headers.append("content-language", "SMH;" + encode_value("origin")  + "=" + encode_value("https://www.example.com"))
         headers.append("content-language", "SMH;" + encode_value("referer") + "=" + encode_value("https://foo.example.com/bar"))
         headers.append("content-language", "SMH;" + encode_value("x-foo")   + "=" + encode_value("bar"))

         fetch('http://httpbin.org/headers', {headers})
         .then(res => res.json())
         .then(console.log)
       ```
  3. add request headers embedded into the value of the header: [`Content-Type`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Type)
     - format of value:
       * `multipart/form-data; boundary=SMH;${encoded_headers_list}`
       * `encoded_headers_list` is a `;` separated list of `${encoded_name}=${encoded_value}`
       * `encoded_name` can be encoded in either of the following ways:
         1. as an integer,<br>which is effectively an enumeration that includes the names of all forbidden request headers
         2. base64 encoded
       * `encoded_value` is always base64 encoded
       * the base64 encoding uses a custom alphabet:
         - `+` is replaced by: `-`
         - `/` is replaced by: `*`
     - conditions:
       * the extension is either enabled globally, or enabled for the current browser tab
     - purpose:
       * to allow Javascript network requests (ex: XHR, fetch) to add/modify [forbidden request headers](https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_request_header)
     - implications:
       * the presence of this [CORS safelisted HTTP request header](https://developer.mozilla.org/en-US/docs/Glossary/CORS-safelisted_request_header) will _NOT_ trigger a [CORS preflight OPTIONS request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request), when the length of the boundary is &lt;= 70 characters
     - example:
       ```javascript
         const enum_forbidden_header_names = ["accept-charset", "accept-encoding", "access-control-request-headers", "access-control-request-method", "access-control-request-private-network", "connection", "content-length", "cookie", "date", "dnt", "expect", "host", "keep-alive", "origin", "referer", "set-cookie", "te", "trailer", "transfer-encoding", "upgrade", "user-agent", "via", "x-http-method", "x-http-method-override", "x-method-override"]

         const encode_name = (name) => enum_forbidden_header_names.indexOf(name.toLowerCase())
         const encode_value = (val) => btoa(val).replace(/=+$/, '').replace(/[\+]/g, '-').replace(/[\/]/g, '*')

         const cors_safelisted_header_values = []
         cors_safelisted_header_values.push(encode_name("origin")  + "=" + encode_value("https://www.example.com"))
         cors_safelisted_header_values.push(encode_name("referer") + "=" + encode_value("https://foo.example.com/bar"))
         cors_safelisted_header_values.push(encode_value("x-foo")  + "=" + encode_value("bar"))

         const headers = {}
         headers["content-type"] = 'multipart/form-data; boundary=SMH;' + cors_safelisted_header_values.join(';')

         fetch('http://httpbin.org/headers', {headers})
         .then(res => res.json())
         .then(console.log)
       ```

## Screenshots

![screenshot](./etc/screenshots/animation.gif)

- - - -

# [SimpleModifyHeaders v1.6.7](https://github.com/didierfred/SimpleModifyHeaders/tree/v1.6.7)

The following is the original [README](https://github.com/didierfred/SimpleModifyHeaders/blob/v1.6.7/README.md)&hellip;<br>
some features have since [changed](#summary-of-changes)

- - - -

## Description

Extension for Firefox and Chrome.

The extension rewrites the headers based on a rules table.

The extension can be started and stopped via the button on the top right.

To save and apply the modification, you need to click on the save button.

It's possible to:
-  export the configuration into a file (json format)
-  import the configuration from a file. It supports the format of the Modifyheaders plugin

## Rules table

The rules table contains lines with the following parameters:
- action: add, modify or delete a header field
- header field name
- header field value
- comment: a comment
- apply on: "request" if the modification applies to the request headers or "response" if the modification applies to the response headers
- status: on if the modification is active, off otherwise

## Url pattern

We can choose the URLs on which the modifications are applied by modifying the URL pattern :
- The URL pattern must follow the syntax defined by https://developer.chrome.com/extensions/match_patterns
- Putting an empty string on the field will select all URLs
- It's possible to select multiple URL patterns using a semicolon (;) separator
- It's not possible to define a specific port number https://stackoverflow.com/questions/11425591/match-port-in-chrome-extension-pattern

## Parameters

The parameters button permits to:
- Activate debug mode: shows detailed log messages in the extension debugging console of the browser.
- Show comments: show comments field on the config panel
- Filter URL by rules: activate the possibility to filter URL for each rule in the config panel. The header field will be modified only if the URL contains the configured value.

## Firefox-specific issue

According to the version of Firefox, the addition of a new header behaves differently. In the latest version, when you choose the "add" action and the header exists, it appends the value, while in the old version, it replaces it. If you want to modify an exiting header, you should use "modify" instead of "add"

## Limitation

Due to limitations in the webRequest API of browsers, headers of requests, which are invoked by Javascript could not be modified.

## Extension permissions

In order to work, the following browser permissions are needed for the extension:
- storage: needed to store the configuration and the rules
- activeTab, tabs: needed to show the configuration screen in the browser tab.
- webRequest, webRequestBlocking ,<all_urls>: needed to modify the headers according to the rules table.

## License

The code is Open Source under [Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/)
