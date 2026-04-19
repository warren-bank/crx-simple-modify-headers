"use strict";

let config
let started = 'off'
let active_headers_groups = ['default']
let active_headers = []
let active_tabs = {}
let active_tabs_count = 0
let default_icon_color = 'black'

/*
* Initialize global state
*
*/
loadFromBrowserStorage(['config', 'started', 'active_headers_groups'], function (result) {
  if (result.config === undefined) {
    loadDefaultConfiguration()
  }
  else {
    try {
      started = result.started
      active_headers_groups = result.active_headers_groups

      config = JSON.parse(result.config)
      upgradeConfig()

      if (!config || !config.headers || (typeof config.headers !== 'object'))
        throw 0
    }
    catch(e) {
      loadDefaultConfiguration()
    }
  }

  preProcessActiveHeadersGroups()
  preProcessConfig()

  if (started === 'on') {
    start(true)
  }
  else if (started !== 'off') {
    started = 'off'
    storeInBrowserStorage({ started })
  }

  // listen for change in configuration or start/stop
  chrome.runtime.onMessage.addListener(notify)
})

function loadDefaultConfiguration() {
  console.log('Load default config')

  const headers = {
    "default": [
    ],
    "allow CORS": [{
      url_contains: '^.*$',
      action:       'delete',
      header_name:  'sec-fetch-*',
      header_value: '',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'sec-fetch-mode',
      header_value: 'same-origin',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'sec-fetch-site',
      header_value: 'same-origin',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'delete',
      header_name:  'access-control-*',
      header_value: '',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'access-control-allow-origin',
      header_value: '*',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'access-control-allow-headers',
      header_value: '*',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'access-control-allow-methods',
      header_value: '*',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'access-control-allow-credentials',
      header_value: 'true',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'access-control-expose-headers',
      header_value: '*',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'access-control-max-age',
      header_value: '600',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    }],
    "disable CSP": [{
      url_contains: '^.*$',
      action:       'delete',
      header_name:  'content-security-policy',
      header_value: '',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },{
      url_contains: '',
      action:       'delete',
      header_name:  'content-security-policy-report-only',
      header_value: '',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },{
      url_contains: '',
      action:       'delete',
      header_name:  'x-frame-options',
      header_value: '',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    }],
    "open as text": [{
      url_contains: '^.*(?:\\.(?:csv|srt|vtt|webvtt|m3u8|mpd)(?:[#\\?].*)?|#open-as-text)$',
      action:       'add_or_modify',
      header_name:  'content-type',
      header_value: 'text/plain; charset=utf-8',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },{
      url_contains: '',
      action:       'delete',
      header_name:  'content-disposition',
      header_value: '',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    }],
    "send as XHR": [{
      url_contains: '^.*$',
      action:       'add_or_modify',
      header_name:  'x-requested-with',
      header_value: 'XMLHttpRequest',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    }],
    "UserAgent: Chrome 132, Win10": [{
      url_contains: '^.*$',
      action:       'add_or_modify',
      header_name:  'user-agent',
      header_value: 'Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.6788.76 Safari/537.36',
      comment:      'test at: https://httpbin.org/headers',
      apply_on:     'req',
      status:       'on'
    }],
    "RawGit": [{
      url_contains: '^https://raw\\.githubusercontent\\.com/.*$',
      action:       'delete',
      header_name:  'content-security-policy',
      header_value: '',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.htm[l]?(?:[#\\?].*)?$',
      action:       'add_or_modify',
      header_name:  'content-type',
      header_value: 'text/html; charset=utf-8',
      comment:      'https://developer.mozilla.org/en-US/docs/Web/HTTP/MIME_types/Common_types',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.css(?:[#\\?].*)?$',
      action:       'add_or_modify',
      header_name:  'content-type',
      header_value: 'text/css; charset=utf-8',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.[m]?js(?:[#\\?].*)?$',
      action:       'add_or_modify',
      header_name:  'content-type',
      header_value: 'text/javascript; charset=utf-8',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.json(?:[#\\?].*)?$',
      action:       'add_or_modify',
      header_name:  'content-type',
      header_value: 'application/json; charset=utf-8',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.ico(?:[#\\?].*)?$',
      action:       'add_or_modify',
      header_name:  'content-type',
      header_value: 'image/vnd.microsoft.icon',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.png(?:[#\\?].*)?$',
      action:       'add_or_modify',
      header_name:  'content-type',
      header_value: 'image/png',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.jp[e]?g(?:[#\\?].*)?$',
      action:       'add_or_modify',
      header_name:  'content-type',
      header_value: 'image/jpeg',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.svg(?:[#\\?].*)?$',
      action:       'add_or_modify',
      header_name:  'content-type',
      header_value: 'image/svg+xml',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.woff[2]?(?:[#\\?].*)?$',
      action:       'add_or_modify',
      header_name:  'content-type',
      header_value: 'font-woff',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.wasm(?:[#\\?].*)?$',
      action:       'add_or_modify',
      header_name:  'content-type',
      header_value: 'application/wasm',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.pdf(?:[#\\?].*)?$',
      action:       'add_or_modify',
      header_name:  'content-type',
      header_value: 'application/pdf',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.mp3(?:[#\\?].*)?$',
      action:       'add_or_modify',
      header_name:  'content-type',
      header_value: 'audio/mpeg',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.mp4(?:[#\\?].*)?$',
      action:       'add_or_modify',
      header_name:  'content-type',
      header_value: 'video/mp4',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.ts(?:[#\\?].*)?$',
      action:       'add_or_modify',
      header_name:  'content-type',
      header_value: 'video/mp2t',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.m3u8(?:[#\\?].*)?$',
      action:       'add_or_modify',
      header_name:  'content-type',
      header_value: 'application/vnd.apple.mpegurl',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },
    {
      url_contains: '^https://raw\\.githubusercontent\\.com/.*\\.mpd(?:[#\\?].*)?$',
      action:       'add_or_modify',
      header_name:  'content-type',
      header_value: 'application/dash+xml',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    }],
    "examples": [{
      url_contains: '^https?://httpbin\\.org/.*$',
      action:       'add',
      header_name:  'test-header-name-1',
      header_value: 'test-header-value-1',
      comment:      'test at: https://httpbin.org/headers',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'test-header-name-2',
      header_value: 'test-header-value-2',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'delete',
      header_name:  'accept*',
      header_value: '',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'delete',
      header_name:  'sec-fetch-*',
      header_value: '',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '^https?://postman-echo\\.com/.*$',
      action:       'add',
      header_name:  'test-header-name-3',
      header_value: 'test-header-value-3',
      comment:      'test at: http://postman-echo.com/get',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'test-header-name-4',
      header_value: 'test-header-value-4',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'add_or_modify',
      header_name:  'accept-encoding',
      header_value: 'identity',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'delete',
      header_name:  'cookie',
      header_value: '',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '^https?://headers\\.jsontest\\.com.*$',
      action:       'delete',
      header_name:  '*',
      header_value: '',
      comment:      'test at: http://headers.jsontest.com',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'test-header-name-5',
      header_value: 'test-header-value-5',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'test-header-name-6',
      header_value: 'test-header-value-6',
      comment:      '',
      apply_on:     'req',
      status:       'on'
    },{
      url_contains: '',
      action:       'add_or_modify',
      header_name:  'content-type',
      header_value: 'text/plain',
      comment:      '',
      apply_on:     'res',
      status:       'on'
    },{
      url_contains: '',
      action:       'add',
      header_name:  'content-disposition',
      header_value: 'attachment; filename="headers.txt"',
      comment:      '',
      apply_on:     'res',
      status:       'off'
    }]
  }

  config = { headers: headers, format_version: 2, debug_mode: false, show_comments: true }
  active_headers_groups = ['examples']
  storeInBrowserStorage({ config: JSON.stringify(config), active_headers_groups: JSON.stringify(active_headers_groups) })
}

// migrate config from format used < v3.0.0
function upgradeConfig() {
  if (!config || !config.headers || !Array.isArray(config.headers))
    return

  config.headers = {"default": config.headers}
  config.format_version = 2
  active_headers_groups = ['default']
  storeInBrowserStorage({ config: JSON.stringify(config), active_headers_groups: JSON.stringify(active_headers_groups) })
}

function preProcessActiveHeadersGroups() {
  active_headers_groups = normalize_headers_groups(active_headers_groups)

  if (!active_headers_groups) {
    active_headers_groups = ['default']
    storeInBrowserStorage({ active_headers_groups: JSON.stringify(active_headers_groups) })
  }
}

function normalize_headers_groups(headers_groups) {
  if (Array.isArray(headers_groups) && headers_groups.length)
    return headers_groups

  try {
    if (!headers_groups || (typeof headers_groups !== 'string'))
      throw 0

    headers_groups = JSON.parse(headers_groups)

    if (!Array.isArray(headers_groups) || !headers_groups.length)
      throw 0
  }
  catch(e) {
    headers_groups = null
  }
  return headers_groups
}

function preProcessConfig() {
  const result = filter_headers_groups(active_headers_groups)

  active_headers_groups = result.headers_groups
  let dirty = result.dirty

  if (!dirty && !active_headers_groups) {
    active_headers_groups = ['default']
    dirty = true
  }
  if (dirty) {
    storeInBrowserStorage({ active_headers_groups: JSON.stringify(active_headers_groups) })
  }

  active_headers = get_combined_headers(active_headers_groups)
}

function filter_headers_groups(headers_groups) {
  let dirty

  if (!headers_groups || !Array.isArray(headers_groups) || !headers_groups.length) {
    headers_groups = null
    dirty = false
  }
  else {
    const all_headers_groups = Object.keys(config.headers)
    const pre_count = headers_groups.length
    headers_groups = headers_groups.filter(headers_group => all_headers_groups.includes(headers_group))
    const post_count = headers_groups.length

    if (!headers_groups.length)
      headers_groups = null

    dirty = headers_groups && (post_count !== pre_count)
  }

  return {headers_groups, dirty}
}

function get_combined_headers(headers_groups) {
  const combined_headers = []

  let header
  let regex_ok
  for (let headers_group of headers_groups) {
    if (!config.headers[headers_group] || !config.headers[headers_group].length)
      continue

    regex_ok = false

    for (let i=0; i < config.headers[headers_group].length; i++) {
      header = config.headers[headers_group][i]

      if (header.status !== 'on')
        continue

      if (header.url_contains) {
        if (typeof header.url_contains === 'string') {
          try {
            header.url_contains = new RegExp(header.url_contains, 'i')
            regex_ok = true
          }
          catch(e) {
            regex_ok = false
          }
        }
        else if (header.url_contains instanceof RegExp) {
          regex_ok = true
        }
        else {
          header.url_contains = null
        }
      }

      if (regex_ok)
        combined_headers.push(header)
    }
  }

  return combined_headers
}

/*
 * This function set a key-value pair in HTTP header "Cookie",
 *   and returns the value of HTTP header after modification.
 * If key already exists, it modify the value.
 * If key doesn't exist, it add the key-value pair.
 * If value is undefined, it delete the key-value pair from cookies.
 *
 * Assuming that, the same key SHOULD NOT appear twice in cookies.
 * Also assuming that, all cookies doesn't contains semicolon.
 *   (99.9% websites are following these rules)
 *
 * Example:
 *   cookie_keyvalues_set("msg=good; user=recolic; password=test", "user", "p")
 *     => "msg=good; user=p; password=test"
 *   cookie_keyvalues_set("msg=good; user=recolic; password=test", "time", "night")
 *     => "msg=good; user=recolic; password=test;time=night"
 */
function cookie_keyvalues_set(original_cookies, key, value) {
  let new_element = key + "=" + value; // not used if value is undefined.
  let cookies_ar = original_cookies.split(";").filter(e => e.trim().length > 0);
  let selected_cookie_index = cookies_ar.findIndex(kv => kv.trim().startsWith(key+"="));
  if (selected_cookie_index == -1) {
    if (value !== undefined)
      cookies_ar.push(new_element);
  }
  else {
    if (value === undefined)
      cookies_ar.splice(selected_cookie_index, 1);
    else
      cookies_ar.splice(selected_cookie_index, 1, new_element);
  }
  return cookies_ar.join(";");
}

/*
 * This function modify the HTTP response header "Set-Cookie",
 *   and replace the value of its cookie, to some new_value.
 * If key doesn't match original_set_cookie_header_content, new key is used in result.
 *
 * Example:
 *   set_cookie_modify_cookie_value("token=123; path=/; expires=Sat, 30 Oct 2021 17:57:32 GMT; secure; HttpOnly", "token", "bar")
 *     => "token=bar; path=/; expires=Sat, 30 Oct 2021 17:57:32 GMT; secure; HttpOnly"
 *   set_cookie_modify_cookie_value("  user=recolic", "user", "hacker")
 *     => "user=hacker"
 *   set_cookie_modify_cookie_value("user=recolic; path=/; HttpOnly", "token", "bar")
 *     => "token=bar; path=/; HttpOnly"
 */
function set_cookie_modify_cookie_value(original_set_cookie_header_content, key, new_value) {
  let trimmed = original_set_cookie_header_content.trimStart();
  let original_attributes = trimmed.indexOf(";") === -1 ? "" : trimmed.substring(trimmed.indexOf(";"))
  return key + "=" + new_value + original_attributes;
}

/*
* Standard function to log messages
*
*/
function log(message) {
  console.log(new Date() + ' SimpleModifyHeader : ' + message)
}

/*
* Rewrite HTTP headers (add, modify, or delete)
*
*/
function rewriteHttpHeaders(headers, url, apply_on, active_rewrite_headers) {
  const headersType = (apply_on === 'req') ? 'request' : 'response'

  if (config.debug_mode) log('Start modify ' + headersType + ' headers for url ' + url)
  let prev_url_contains = null
  for (let to_modify of active_rewrite_headers) {
    // sanity check
    if (!to_modify.action || !to_modify.apply_on || !to_modify.header_name)
      continue

    if (to_modify.url_contains) prev_url_contains = to_modify.url_contains

    const header_name_lc     = to_modify.header_name.toLowerCase()
    const header_name_lc_end = header_name_lc.slice(-1)
    const header_name_lc_pre = header_name_lc.slice(0, -1)

    if ((to_modify.status === 'on') && (to_modify.apply_on === apply_on) && prev_url_contains && prev_url_contains.test(url)) {
      let modify_count = 0

      if (
        (to_modify.action === 'modify') ||
        (to_modify.action === "add_or_modify")
      ) {
        for (let header of headers) {
          if (header.name.toLowerCase() === header_name_lc) {
            if (config.debug_mode) log('Modify ' + headersType + ' header :  name= ' + header.name + ',old value=' + header.value + ',new value=' + to_modify.header_value + ' for url ' + url)
            header.value = to_modify.header_value
            modify_count += 1
          }
        }
      }

      if (
        (to_modify.action === 'add') ||
        (
          (to_modify.action === "add_or_modify") &&
          (modify_count === 0)
        )
      ) {
        if (config.debug_mode) log('Add ' + headersType + ' header : name=' + to_modify.header_name + ',value=' + to_modify.header_value + ' for url ' + url)
        const new_header = { name: to_modify.header_name, value: to_modify.header_value }
        headers.push(new_header)
      }

      else if (to_modify.action === 'delete') {
        for (let i = (headers.length - 1); i >= 0; i--) {
          if (header_name_lc_end === '*') {
            // fuzzy match
            if (headers[i].name.toLowerCase().indexOf(header_name_lc_pre) === 0) {
              if (config.debug_mode) log('Delete ' + headersType + ' header :  name=' + headers[i].name + ' for url ' + url)
              headers.splice(i, 1)
            }
          }
          else {
            // exact match
            if (headers[i].name.toLowerCase() === header_name_lc) {
              if (config.debug_mode) log('Delete ' + headersType + ' header :  name=' + headers[i].name + ' for url ' + url)
              headers.splice(i, 1)
            }
          }
        }
      }

      else if (to_modify.action === "cookie_add_or_modify") {
        if (apply_on === 'req') {
          let header_cookie = headers.find(header => header.name.toLowerCase() === "cookie");
          let new_cookie = cookie_keyvalues_set(header_cookie === undefined ? "" : header_cookie.value, to_modify.header_name, to_modify.header_value);
          if (header_cookie === undefined) {
            headers.push({"name": "Cookie", "value": new_cookie});
            if (config.debug_mode) log("cookie_add_or_modify.req new_header : name=Cookie,value=" + new_cookie + " for url " + url);
          }
          else {
            header_cookie.value = new_cookie;
            if (config.debug_mode) log("cookie_add_or_modify.req modify_header : name=Cookie,value=" + new_cookie + " for url " + url);
          }
        }
        else {
          let header_cookie = headers.find(header => 
              header.name.toLowerCase() === "set-cookie" && 
              header.value.toLowerCase().trim().startsWith(to_modify.header_name.toLowerCase()+"=")
          );
          let new_header_value = set_cookie_modify_cookie_value(header_cookie === undefined ? "" : header_cookie.value, to_modify.header_name, to_modify.header_value);
          if (header_cookie === undefined) {
            log("SimpleModifyHeaders.Warning: you're using cookie_add_or_modify in Response. While adding new cookie in response, this plugin only generates `Set-Cookie: cookie-name=cookie-value `, without ANY additional attributes. Add a `Set-Cookie` header if you need them. ");
            headers.push({"name": "Set-Cookie", "value": new_header_value});
            if (config.debug_mode) log("cookie_add_or_modify.resp new_header : name=Cookie,value=" + new_header_value + " for url " + url);
          }
          else {
            header_cookie.value = new_header_value;
            if (config.debug_mode) log("cookie_add_or_modify.resp modify_header : name=Cookie,value=" + new_header_value + " for url " + url);
          }
        }
      }

      else if (to_modify.action === "cookie_delete") {
        if (apply_on === 'req') {
          let header_cookie = headers.find(header => header.name.toLowerCase() === "cookie");
          let new_cookie = cookie_keyvalues_set(header_cookie === undefined ? "" : header_cookie.value, to_modify.header_name, undefined);
          if (header_cookie === undefined) {
            if (config.debug_mode) log("cookie_delete.req: no cookie header found. doing nothing for url " + url);
          }
          else {
            header_cookie.value = new_cookie;
            if (config.debug_mode) log("cookie_delete.req modify_header : name=Cookie,value=" + new_cookie + " for url " + url);
          }
        }
        else {
          let index = headers.findIndex(header => 
              header.name.toLowerCase() === "set-cookie" && 
              header.value.toLowerCase().trim().startsWith(to_modify.header_name.toLowerCase()+"=")
          );
          if (index === -1) {
            if (config.debug_mode) log("cookie_delete.resp: no matching set-cookie header. doing nothing for url " + url);
          }
          else {
            headers.splice(index, 1);
            if (config.debug_mode) log("cookie_delete.resp delete_header : name=" + to_modify.header_name + " for url " + url);
          }
        }
      }
    }
  }
  if (config.debug_mode) log('End modify ' + headersType + ' headers for url ' + url)
}

/*
* Rewrite HTTP request headers (add, modify, or delete)
*
*/
function rewriteRequestHeaders(details) {
  const active_rewrite_headers = get_active_rewrite_headers(details.tabId, details.initiator, [])
  if (!active_rewrite_headers) return

  const headers  = details.requestHeaders
  const url      = details.url
  const apply_on = 'req'

  modify_active_rewrite_headers_from_custom_req_headers(active_rewrite_headers, headers)
  modify_active_rewrite_headers_from_cors_safelisted_req_header(active_rewrite_headers, headers)
  if (!active_rewrite_headers.length) return

  rewriteHttpHeaders(headers, url, apply_on, active_rewrite_headers)

  return { requestHeaders: headers }
}

function modify_active_rewrite_headers_from_custom_req_headers(active_rewrite_headers, headers) {
  // Automatic:   Always replace "x-simple-modify-headers-${name}" with "${name}"
  // Purpose:     To allow Javascript network requests (ex: XHR, fetch) to add/modify forbidden request headers
  // Implication: These custom HTTP request headers trigger a CORS preflight OPTIONS request
  // References:  https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_request_header
  //              https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request
  //              https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Request-Headers
  const name_prefix = 'x-simple-modify-headers-'
  const template_hdr = {
    url_contains: new RegExp('^.*$'),
    action:       '',
    header_name:  '',
    header_value: '',
    comment:      '',
    apply_on:     'req',
    status:       'on'
  }

  for (let header of headers) {
    if (header.name.toLowerCase().startsWith(name_prefix)) {
      active_rewrite_headers.push({
        ...template_hdr,
        action:       'delete',
        header_name:  header.name
      })
      active_rewrite_headers.push({
        ...template_hdr,
        action:       'add_or_modify',
        header_name:  header.name.substring(name_prefix.length, header.name.length),
        header_value: header.value
      })
    }
  }
}

function modify_active_rewrite_headers_from_cors_safelisted_req_header(active_rewrite_headers, headers) {
  // Automatic:   Add headers embedded into the value of the header: "Content-Language"
  // Purpose:     To allow Javascript network requests (ex: XHR, fetch) to add/modify forbidden request headers
  // Implication: This CORS safelisted HTTP request header does NOT trigger a CORS preflight OPTIONS request
  // References:  https://developer.mozilla.org/en-US/docs/Glossary/Forbidden_request_header
  //              https://developer.mozilla.org/en-US/docs/Glossary/CORS-safelisted_request_header
  //              https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Language
  const enum_forbidden_header_names = ["accept-charset", "accept-encoding", "access-control-request-headers", "access-control-request-method", "access-control-request-private-network", "connection", "content-length", "cookie", "date", "dnt", "expect", "host", "keep-alive", "origin", "referer", "set-cookie", "te", "trailer", "transfer-encoding", "upgrade", "user-agent", "via", "x-http-method", "x-http-method-override", "x-method-override"]
  const cors_safelisted_header_name = 'content-language'
  const base64_regex = '[A-Za-z0-9\\-\\*]'
  const value_regexs = {
    name_enum:  new RegExp(`^SMH;([\\d]+)=(${base64_regex}*)[=]*$`),
    name_value: new RegExp(`^SMH;(${base64_regex}+)=(${base64_regex}*)[=]*$`)
  }
  const template_hdr = {
    url_contains: new RegExp('^.*$'),
    action:       '',
    header_name:  '',
    header_value: '',
    comment:      '',
    apply_on:     'req',
    status:       'on'
  }

  const decode_name_enum = (val) => {
    try {
      const enum_forbidden_header_name_index = parseInt(val, 10)
      return enum_forbidden_header_names[enum_forbidden_header_name_index]
    }
    catch(e) {
      return null
    }
  }
  const decode_base64_value = (val) => {
    try {
      val = val.replace(/[\-]/g, '+').replace(/[\*]/g, '/')
      return atob(val)
    }
    catch(e) {
      return null
    }
  }

  for (let header of headers) {
    if (header.name.toLowerCase() === cors_safelisted_header_name) {
      const all_header_values = header.value.split(',').map(val => val.trim())
      const new_header_values = []

      for (let header_value of all_header_values) {
        let decoded_header_name, decoded_header_value

        if (!decoded_header_name) {
          const match = value_regexs.name_enum.exec(header_value)

          if (match) {
            decoded_header_name  = decode_name_enum(match[1])
            decoded_header_value = decode_base64_value(match[2])
          }
        }

        if (!decoded_header_name) {
          const match = value_regexs.name_value.exec(header_value)

          if (match) {
            decoded_header_name  = decode_base64_value(match[1])
            decoded_header_value = decode_base64_value(match[2])
          }
        }

        if (decoded_header_name) {
          active_rewrite_headers.push({
            ...template_hdr,
            action:       'add_or_modify',
            header_name:  decoded_header_name,
            header_value: decoded_header_value
          })
        }
        else {
          new_header_values.push(header_value)
        }
      }

      if (new_header_values.length) {
        header.value = new_header_values.join(',')
      }
      else {
        active_rewrite_headers.push({
          ...template_hdr,
          action:      'delete',
          header_name: header.name
        })
      }

      break
    }
  }
}

/*
* Rewrite HTTP response headers (add, modify, or delete)
*
*/
function rewriteResponseHeaders(details) {
  const active_rewrite_headers = get_active_rewrite_headers(details.tabId, details.initiator)
  if (!active_rewrite_headers) return

  const headers  = details.responseHeaders
  const url      = details.url
  const apply_on = 'res'

  rewriteHttpHeaders(headers, url, apply_on, active_rewrite_headers)

  return { responseHeaders: headers }
}

/*
* Listen for message form config.js
* if message is reload : reload the configuration
* if message is on : start the modify header
* if message is off : stop the modify header
*
**/
function notify(message, sender, sendResponse) {
  if (!message || !(typeof message === 'object') || !message.action || !(typeof message.action === 'string'))
    return

  switch(message.action) {
    case 'change-groups': {
        if (config.debug_mode) log('Change active headers groups')
        loadFromBrowserStorage(['active_headers_groups'], function (result) {
          active_headers_groups = result.active_headers_groups
          preProcessActiveHeadersGroups()
          preProcessConfig()
        })
      }
      break
    case 'reload': {
        if (config.debug_mode) log('Reload configuration')
        loadFromBrowserStorage(['config', 'active_headers_groups'], function (result) {
          try {
            config = JSON.parse(result.config)
            active_headers_groups = result.active_headers_groups
            preProcessActiveHeadersGroups()
            preProcessConfig()
          }
          catch(e) {
            active_headers = []
          }
        })
      }
      break
    case 'on': {
        stopAllTabs()
        start()
      }
      break
    case 'off': {
        stop()
      }
      break
    case 'tab-on':
    case 'tab-update': {
        loadFromBrowserStorage(['active_tab_headers_groups'], function (result) {
          const active_tab_headers_groups = normalize_headers_groups(result.active_tab_headers_groups)
          const perform_update = (message.action === 'tab-update')

          startTab(active_tab_headers_groups, perform_update).then(sendResponse)
          storeInBrowserStorage({ 'active_tab_headers_groups': '[]' })
        })
        return true
      }
      break
    case 'tab-off': {
        stopTab().then(sendResponse)
        return true
      }
      break
    case 'is-tab-on': {
        isTabStarted().then(sendResponse)
        return true
      }
      break
    case 'change-default-icon': {
        if (message.color && (message.color !== default_icon_color)) {
          default_icon_color = message.color

          if (started !== 'on')
            chrome.browserAction.setIcon({ path: getIconPath(default_icon_color) })
        }
      }
      break
  }
}

/*
* Add rewriteRequestHeaders  as a listener to onBeforeSendHeaders.
* Add rewriteResponseHeaders as a listener to onHeadersReceived.
* Make it "blocking" so we can modify the headers.
*
*/
function addListeners() {
  let extraInfoSpec

  // "extraHeaders" option is needed for Chrome v72+: https://developer.chrome.com/extensions/webRequest
  extraInfoSpec = chrome.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty('EXTRA_HEADERS')
    ? ['blocking', 'requestHeaders', 'extraHeaders']
    : ['blocking', 'requestHeaders']

  chrome.webRequest.onBeforeSendHeaders.addListener(
    rewriteRequestHeaders,
    { urls: ['<all_urls>'] },
    extraInfoSpec
  )

  // "extraHeaders" option is needed for Chrome v72+: https://developer.chrome.com/extensions/webRequest
  extraInfoSpec = chrome.webRequest.OnHeadersReceivedOptions.hasOwnProperty('EXTRA_HEADERS')
    ? ['blocking', 'responseHeaders', 'extraHeaders']
    : ['blocking', 'responseHeaders']

  chrome.webRequest.onHeadersReceived.addListener(
    rewriteResponseHeaders,
    { urls: ['<all_urls>'] },
    extraInfoSpec
  )
}

/*
* Remove the two listeners
*
*/
function removeListeners() {
  chrome.webRequest.onBeforeSendHeaders.removeListener(rewriteRequestHeaders)
  chrome.webRequest.onHeadersReceived.removeListener(rewriteResponseHeaders)
}

function start(skip_check) {
  if (!skip_check && (started === 'on'))
    return

  addListeners()
  chrome.browserAction.setIcon({ path: getIconPath('green') })
  started = 'on'
  if (config.debug_mode) log('Start modifying headers')
}

function stop(skip_check) {
  if (!skip_check && (started === 'off'))
    return

  removeListeners()
  chrome.browserAction.setIcon({ path: getIconPath(default_icon_color) })
  started = 'off'
  if (config.debug_mode) log('Stop modifying headers')
}

function getIconPath(color) {
  return {
    "32": `icons/modify-32-${color}.png`,
    "48": `icons/modify-48-${color}.png`
  }
}

async function startTab(active_tab_headers_groups, perform_update) {
  try {
    if (started === 'on') throw 0
    if (!active_tab_headers_groups) throw 0

    const {id, url} = await getActiveTabId()

    if (!!active_tabs[id] && !perform_update)
      return true

    if (!active_tabs[id] && perform_update) throw 0

    const active_tab_headers = get_combined_headers(active_tab_headers_groups)
    if (!active_tab_headers.length) throw 0

    active_tabs[id] = {
      url: url.toLowerCase(),
      active_headers_groups: active_tab_headers_groups,
      active_headers: active_tab_headers
    }

    if (!perform_update) {
      if (active_tabs_count === 0)
        addListeners()

      active_tabs_count += 1
    }

    return true
  }
  catch(e) {
    return false
  }
}

async function stopTab(id) {
  try {
    if (started === 'on') throw 0

    if (!id)
      id = (await getActiveTabId()).id

    if (!active_tabs[id])
      return true

    delete active_tabs[id]
    active_tabs_count -= 1

    if (active_tabs_count === 0)
      removeListeners()

    return true
  }
  catch(e) {
    return false
  }
}

async function isTabStarted() {
  try {
    if (started === 'on') throw 0

    const {id} = await getActiveTabId()

    if (!active_tabs[id]) throw 0

    return JSON.stringify(active_tabs[id].active_headers_groups)
  }
  catch(e) {
    return false
  }
}

function stopAllTabs() {
  active_tabs = {}
  active_tabs_count = 0
  removeListeners()
}

function getActiveTabId() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(
      {active: true, lastFocusedWindow: true},
      function(matching_tabs_array) {
        if (matching_tabs_array && Array.isArray(matching_tabs_array) && matching_tabs_array.length) {
          const tab = matching_tabs_array.find(tab => tab.id && (tab.id !== chrome.tabs.TAB_ID_NONE) && tab.url)

          if (tab) {
            resolve({id: String(tab.id), url: tab.url})
            return
          }
        }
        reject()
      }
    )
  })
}

function get_active_rewrite_headers(tabId, initiator, default_value = null) {
  if (started === 'on') return getNonEmptyArray(active_headers, default_value)

  tabId = (tabId === chrome.tabs.TAB_ID_NONE)
    ? find_tabId_for_origin(initiator)
    : String(tabId)

  if (tabId && active_tabs[tabId]) return getNonEmptyArray(active_tabs[tabId].active_headers, default_value)

  return null
}

function getNonEmptyArray(value, default_value = null) {
  return (Array.isArray(value) && !!value.length) ? value : default_value
}

function find_tabId_for_origin(origin) {
  const tabIds = []

  if (origin) {
    origin = origin.toLowerCase()

    for (let tabId in active_tabs) {
      const {url} = active_tabs[tabId]

      if (url.startsWith(origin))
        tabIds.push(tabId)
    }
  }

  return (tabIds.length === 1)
    ? tabIds[0]
    : null
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!tabId || !changeInfo?.url) return

  tabId = String(tabId)
  if (!active_tabs[tabId]) return

  active_tabs[tabId].url = changeInfo.url.toLowerCase()
})

chrome.tabs.onRemoved.addListener(tabId => {
  stopTab(
    String(tabId)
  )
})
