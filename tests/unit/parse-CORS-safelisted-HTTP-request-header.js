  const enum_forbidden_header_names  = ["accept-charset", "accept-encoding", "access-control-request-headers", "access-control-request-method", "access-control-request-private-network", "connection", "content-length", "cookie", "date", "dnt", "expect", "host", "keep-alive", "origin", "referer", "set-cookie", "te", "trailer", "transfer-encoding", "upgrade", "user-agent", "via", "x-http-method", "x-http-method-override", "x-method-override"]

  const base64_regex = '[A-Za-z0-9\\-\\*]'
  const value_regexs = {
    name_enum:  new RegExp(`^SMH;([\\d]+)=(${base64_regex}*)[=]*$`),
    name_value: new RegExp(`^SMH;(${base64_regex}+)=(${base64_regex}*)[=]*$`)
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

  const decode_header = (header) => {
    const all_header_values = header.split(',').map(val => val.trim())

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
        console.log(decoded_header_name + ': ' + decoded_header_value)
      }
    }
  }

decode_header('SMH;1=Z3ppcCwgZGVmbGF0ZQ,SMH;c2VjLWZldGNoLW1vZGU=bmF2aWdhdGU')
  // accept-encoding: gzip, deflate
  // sec-fetch-mode: navigate
