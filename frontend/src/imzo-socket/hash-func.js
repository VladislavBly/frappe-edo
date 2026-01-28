const Utf8 = {} // Utf8 namespace
Utf8.encode = function(strUni) {
  // use regular expressions & String.replace callback function for better efficiency
  // than procedural approaches
  let strUtf = strUni.replace(
    // U+0080 - U+07FF => 2 bytes 110yyyyy, 10zzzzzz
    /[\u0080-\u07ff]/g,
    function(c) {
      const cc = c.charCodeAt(0)
      return String.fromCharCode(0xc0 | (cc >> 6), 0x80 | (cc & 0x3f))
    }
  )
  strUtf = strUtf.replace(
    // U+0800 - U+FFFF => 3 bytes 1110xxxx, 10yyyyyy, 10zzzzzz
    /[\u0800-\uffff]/g,
    function(c) {
      const cc = c.charCodeAt(0)
      return String.fromCharCode(
        0xe0 | (cc >> 12),
        0x80 | ((cc >> 6) & 0x3f),
        0x80 | (cc & 0x3f)
      )
    }
  )
  return strUtf
}

Utf8.decode = function(strUtf) {
  // note: decode 3-byte chars first as decoded 2-byte strings could appear to be 3-byte char!
  let strUni = strUtf.replace(
    // 3-byte chars
    /[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g,
    function(c) {
      // (note parentheses for precence)
      const cc =
        ((c.charCodeAt(0) & 0x0f) << 12) |
        ((c.charCodeAt(1) & 0x3f) << 6) |
        (c.charCodeAt(2) & 0x3f)
      return String.fromCharCode(cc)
    }
  )
  strUni = strUni.replace(
    // 2-byte chars
    /[\u00c0-\u00df][\u0080-\u00bf]/g,
    function(c) {
      // (note parentheses for precence)
      const cc = ((c.charCodeAt(0) & 0x1f) << 6) | (c.charCodeAt(1) & 0x3f)
      return String.fromCharCode(cc)
    }
  )
  return strUni
}

export function CRC32() {
  this.a_table =
    "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D"
  this.b_table = this.a_table.split(" ").map(function(s) {
    return parseInt(s, 16)
  })

  this.calc = function(str) {
    let crc = -1
    for (let i = 0, iTop = str.length; i < iTop; i++) {
      crc = (crc >>> 8) ^ this.b_table[(crc ^ str.charCodeAt(i)) & 0xff]
    }
    const r = (crc ^ -1) >>> 0
    return r.toString(16)
  }
  this.calcHex = function(str) {
    let crc = -1
    for (let i = 0, iTop = str.length; i < iTop; i += 2) {
      crc =
        (crc >>> 8) ^
        this.b_table[(crc ^ parseInt(str.substring(i, i + 2), 16)) & 0xff]
    }
    const r = (crc ^ -1) >>> 0
    return this.pad(r.toString(16), 8)
  }
  this.pad = function(n, width, z) {
    z = z || "0"
    n = n + ""
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
  }
}

export function EIMZOMobile(site_id) {
  this.site_id = site_id
  this.makeQRCode = function(doc_num, text) {
    if (!this.site_id) {
      return
    }
    if (!doc_num) {
      return
    }
    if (!text) {
      return
    }
    const hasher = new GostHash()
    const text_hash = hasher.gosthash(text)
    let code = this.site_id + doc_num + text_hash
    const crcer = new CRC32()
    const crc32 = crcer.calcHex(code)
    code += crc32
    // qrcode.makeCode(code);
    return [text_hash, code]
  }
}

export function GostHash() {
  this.rol = function(word, n) {
    return (word << (n & 0x1f)) | (word >>> (32 - (n & 0x1f)))
  }

  this.ch2hex = function(val) {
    const hext = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "a",
      "b",
      "c",
      "d",
      "e",
      "f"
    ]
    return hext[(val >>> 4) & 15] + hext[val & 15]
  }

  this.str2bytes = function(str) {
    const arr = Array(str.length)
    for (let i = 0; i < str.length; ++i) arr[i] = str.charCodeAt(i) & 255
    return arr
  }

  this.hexStr2bytes = function(str) {
    const hex = str.toLowerCase()
    const hext = "0123456789abcdef"
    const arr = Array(str.length / 2)
    for (let i = 0, k = 0; i < hex.length; i += 2, ++k) {
      arr[k] =
        ((hext.indexOf(hex.charAt(i)) & 0xf) << 4) +
        (hext.indexOf(hex.charAt(i + 1)) & 0xf)
    }
    return arr
  }

  this.toHex = function(str) {
    let hex = ""
    for (let i = 0; i < str.length; i++) {
      hex += "" + str.charCodeAt(i).toString(16)
    }
    return hex
  }

  this.hash = new Array(8)
  this.sum = new Array(8)
  this.message = new Array(32)
  this.length = 0
  this.r = 0
  this.l = 0

  this.gost_sbox = new Array(4)

  for (let j = 0; j < 4; j++) {
    this.gost_sbox[j] = new Array(256)
  }

  /* eight 4-bit S-Boxes as defined by RFC 4351 section 11.2 */
  /*
     var sbox = [
     [4, 10, 9, 2, 13, 8, 0, 14, 6, 11, 1, 12, 7, 15, 5, 3],
     [14, 11, 4, 12, 6, 13, 15, 10, 2, 3, 8, 1, 0, 7, 5, 9],
     [5, 8, 1, 13, 10, 3, 4, 2, 14, 15, 12, 7, 6, 0, 9, 11],
     [7, 13, 10, 1, 0, 8, 9, 15, 14, 4, 6, 12, 11, 2, 5, 3],
     [6, 12, 7, 1, 5, 15, 13, 8, 4, 10, 9, 14, 0, 3, 11, 2],
     [4, 11, 10, 0, 7, 2, 1, 13, 3, 6, 8, 5, 9, 12, 15, 14],
     [13, 11, 4, 1, 3, 15, 5, 9, 0, 10, 14, 7, 6, 8, 2, 12],
     [1, 15, 13, 0, 5, 7, 10, 4, 9, 2, 3, 14, 6, 11, 8, 12]
     ];
     */
  /** CryptoPro S-Box: */

  this.sbox = [
    [10, 4, 5, 6, 8, 1, 3, 7, 13, 12, 14, 0, 9, 2, 11, 15],
    [5, 15, 4, 0, 2, 13, 11, 9, 1, 7, 6, 3, 12, 14, 10, 8],
    [7, 15, 12, 14, 9, 4, 1, 0, 3, 11, 5, 2, 6, 10, 8, 13],
    [4, 10, 7, 12, 0, 15, 2, 8, 14, 1, 6, 5, 13, 11, 9, 3],
    [7, 6, 4, 11, 9, 12, 2, 10, 1, 8, 0, 14, 15, 13, 3, 5],
    [7, 6, 2, 4, 13, 9, 15, 0, 10, 1, 5, 11, 8, 14, 12, 3],
    [13, 14, 4, 1, 7, 0, 5, 10, 3, 12, 8, 15, 6, 2, 9, 11],
    [1, 3, 10, 9, 5, 11, 4, 15, 8, 6, 7, 14, 13, 0, 2, 12]
  ]

  /**
   * Initialize algorithm context before calculaing hash.
   */

  this.gost_init = function() {
    for (let i = 0; i < 8; i++) {
      this.hash[i] = 0
      this.sum[i] = 0
      this.message[4 * i] = 0
      this.message[4 * i + 1] = 0
      this.message[4 * i + 2] = 0
      this.message[4 * i + 3] = 0
    }
    this.length = 0
  }

  /*
   *  A full encryption round of GOST 28147-89.
   *  Temporary variables tmp assumed and variables r and l for left and right
   *  blocks.
   */

  this.GOST_ENCRYPT_ROUND = function(key1, key2) {
    let tmp = key1 + this.r
    this.l ^=
      this.gost_sbox[0][tmp & 0xff] ^
      this.gost_sbox[1][(tmp >>> 8) & 0xff] ^
      this.gost_sbox[2][(tmp >>> 16) & 0xff] ^
      this.gost_sbox[3][(tmp >>> 24) & 0xff]
    tmp = key2 + this.l
    this.r ^=
      this.gost_sbox[0][tmp & 0xff] ^
      this.gost_sbox[1][(tmp >>> 8) & 0xff] ^
      this.gost_sbox[2][(tmp >>> 16) & 0xff] ^
      this.gost_sbox[3][(tmp >>> 24) & 0xff]
  }

  /* encrypt a block with the given key */

  this.GOST_ENCRYPT = function(ii, key, varhash) {
    this.r = varhash[ii]
    this.l = varhash[ii + 1]
    this.GOST_ENCRYPT_ROUND(key[0], key[1])
    this.GOST_ENCRYPT_ROUND(key[2], key[3])
    this.GOST_ENCRYPT_ROUND(key[4], key[5])
    this.GOST_ENCRYPT_ROUND(key[6], key[7])
    this.GOST_ENCRYPT_ROUND(key[0], key[1])
    this.GOST_ENCRYPT_ROUND(key[2], key[3])
    this.GOST_ENCRYPT_ROUND(key[4], key[5])
    this.GOST_ENCRYPT_ROUND(key[6], key[7])
    this.GOST_ENCRYPT_ROUND(key[0], key[1])
    this.GOST_ENCRYPT_ROUND(key[2], key[3])
    this.GOST_ENCRYPT_ROUND(key[4], key[5])
    this.GOST_ENCRYPT_ROUND(key[6], key[7])
    this.GOST_ENCRYPT_ROUND(key[7], key[6])
    this.GOST_ENCRYPT_ROUND(key[5], key[4])
    this.GOST_ENCRYPT_ROUND(key[3], key[2])
    this.GOST_ENCRYPT_ROUND(key[1], key[0])
    return [this.l, this.r]
  }
  /**
   * The core transformation. Process a 512-bit block.
   *
   * @param block the message block to process
   */

  this.gost_block_compress = function(block) {
    const key = new Array(8)
    const u = new Array(8)
    const v = new Array(8)
    const w = new Array(8)
    const s = new Array(8)

    /* u := hash, v := <256-bit message block> */
    for (var i = 0; i < 8; i++) {
      u[i] = this.hash[i]
      v[i] = block[i]
    }

    /* w := u xor v */
    w[0] = u[0] ^ v[0]
    w[1] = u[1] ^ v[1]
    w[2] = u[2] ^ v[2]
    w[3] = u[3] ^ v[3]
    w[4] = u[4] ^ v[4]
    w[5] = u[5] ^ v[5]
    w[6] = u[6] ^ v[6]
    w[7] = u[7] ^ v[7]

    /* calculate keys, encrypt hash and store result to the s[] array */
    for (var i = 0; ; i += 2) {
      /* key generation: key_i := P(w) */
      key[0] =
        (w[0] & 0x000000ff) |
        ((w[2] & 0x000000ff) << 8) |
        ((w[4] & 0x000000ff) << 16) |
        ((w[6] & 0x000000ff) << 24)
      key[1] =
        ((w[0] & 0x0000ff00) >>> 8) |
        (w[2] & 0x0000ff00) |
        ((w[4] & 0x0000ff00) << 8) |
        ((w[6] & 0x0000ff00) << 16)
      key[2] =
        ((w[0] & 0x00ff0000) >>> 16) |
        ((w[2] & 0x00ff0000) >>> 8) |
        (w[4] & 0x00ff0000) |
        ((w[6] & 0x00ff0000) << 8)
      key[3] =
        ((w[0] & 0xff000000) >>> 24) |
        ((w[2] & 0xff000000) >>> 16) |
        ((w[4] & 0xff000000) >>> 8) |
        (w[6] & 0xff000000)
      key[4] =
        (w[1] & 0x000000ff) |
        ((w[3] & 0x000000ff) << 8) |
        ((w[5] & 0x000000ff) << 16) |
        ((w[7] & 0x000000ff) << 24)
      key[5] =
        ((w[1] & 0x0000ff00) >>> 8) |
        (w[3] & 0x0000ff00) |
        ((w[5] & 0x0000ff00) << 8) |
        ((w[7] & 0x0000ff00) << 16)
      key[6] =
        ((w[1] & 0x00ff0000) >>> 16) |
        ((w[3] & 0x00ff0000) >>> 8) |
        (w[5] & 0x00ff0000) |
        ((w[7] & 0x00ff0000) << 8)
      key[7] =
        ((w[1] & 0xff000000) >>> 24) |
        ((w[3] & 0xff000000) >>> 16) |
        ((w[5] & 0xff000000) >>> 8) |
        (w[7] & 0xff000000)

      /* encryption: s_i := E_{key_i} (h_i) */
      const res = this.GOST_ENCRYPT(i, key, this.hash)
      s[i] = res[0]
      s[i + 1] = res[1]

      if (i == 0) {
        /* w:= A(u) ^ A^2(v) */
        w[0] = u[2] ^ v[4]
        w[1] = u[3] ^ v[5]
        w[2] = u[4] ^ v[6]
        w[3] = u[5] ^ v[7]
        w[4] = u[6] ^ (v[0] ^= v[2])
        w[5] = u[7] ^ (v[1] ^= v[3])
        w[6] = (u[0] ^= u[2]) ^ (v[2] ^= v[4])
        w[7] = (u[1] ^= u[3]) ^ (v[3] ^= v[5])
      } else if ((i & 2) != 0) {
        if (i == 6)
          break /* w := A^2(u) xor A^4(v) xor C_3; u := A(u) xor C_3 */
        /* C_3=0xff00ffff000000ffff0000ff00ffff0000ff00ff00ff00ffff00ff00ff00ff00 */
        u[2] ^= u[4] ^ 0x000000ff
        u[3] ^= u[5] ^ 0xff00ffff
        u[4] ^= 0xff00ff00
        u[5] ^= 0xff00ff00
        u[6] ^= 0x00ff00ff
        u[7] ^= 0x00ff00ff
        u[0] ^= 0x00ffff00
        u[1] ^= 0xff0000ff

        w[0] = u[4] ^ v[0]
        w[2] = u[6] ^ v[2]
        w[4] = u[0] ^ (v[4] ^= v[6])
        w[6] = u[2] ^ (v[6] ^= v[0])
        w[1] = u[5] ^ v[1]
        w[3] = u[7] ^ v[3]
        w[5] = u[1] ^ (v[5] ^= v[7])
        w[7] = u[3] ^ (v[7] ^= v[1])
      } else {
        /* i==4 here */
        /* w:= A( A^2(u) xor C_3 ) xor A^6(v) */
        w[0] = u[6] ^ v[4]
        w[1] = u[7] ^ v[5]
        w[2] = u[0] ^ v[6]
        w[3] = u[1] ^ v[7]
        w[4] = u[2] ^ (v[0] ^= v[2])
        w[5] = u[3] ^ (v[1] ^= v[3])
        w[6] = (u[4] ^= u[6]) ^ (v[2] ^= v[4])
        w[7] = (u[5] ^= u[7]) ^ (v[3] ^= v[5])
      }
    }

    /* step hash function: x(block, hash) := psi^61(hash xor psi(block xor psi^12(S))) */

    /* 12 rounds of the LFSR and xor in <message block> */
    u[0] = block[0] ^ s[6]
    u[1] = block[1] ^ s[7]
    u[2] =
      block[2] ^
      (s[0] << 16) ^
      (s[0] >>> 16) ^
      (s[0] & 0xffff) ^
      (s[1] & 0xffff) ^
      (s[1] >>> 16) ^
      (s[2] << 16) ^
      s[6] ^
      (s[6] << 16) ^
      (s[7] & 0xffff0000) ^
      (s[7] >>> 16)
    u[3] =
      block[3] ^
      (s[0] & 0xffff) ^
      (s[0] << 16) ^
      (s[1] & 0xffff) ^
      (s[1] << 16) ^
      (s[1] >>> 16) ^
      (s[2] << 16) ^
      (s[2] >>> 16) ^
      (s[3] << 16) ^
      s[6] ^
      (s[6] << 16) ^
      (s[6] >>> 16) ^
      (s[7] & 0xffff) ^
      (s[7] << 16) ^
      (s[7] >>> 16)
    u[4] =
      block[4] ^
      (s[0] & 0xffff0000) ^
      (s[0] << 16) ^
      (s[0] >>> 16) ^
      (s[1] & 0xffff0000) ^
      (s[1] >>> 16) ^
      (s[2] << 16) ^
      (s[2] >>> 16) ^
      (s[3] << 16) ^
      (s[3] >>> 16) ^
      (s[4] << 16) ^
      (s[6] << 16) ^
      (s[6] >>> 16) ^
      (s[7] & 0xffff) ^
      (s[7] << 16) ^
      (s[7] >>> 16)
    u[5] =
      block[5] ^
      (s[0] << 16) ^
      (s[0] >>> 16) ^
      (s[0] & 0xffff0000) ^
      (s[1] & 0xffff) ^
      s[2] ^
      (s[2] >>> 16) ^
      (s[3] << 16) ^
      (s[3] >>> 16) ^
      (s[4] << 16) ^
      (s[4] >>> 16) ^
      (s[5] << 16) ^
      (s[6] << 16) ^
      (s[6] >>> 16) ^
      (s[7] & 0xffff0000) ^
      (s[7] << 16) ^
      (s[7] >>> 16)
    u[6] =
      block[6] ^
      s[0] ^
      (s[1] >>> 16) ^
      (s[2] << 16) ^
      s[3] ^
      (s[3] >>> 16) ^
      (s[4] << 16) ^
      (s[4] >>> 16) ^
      (s[5] << 16) ^
      (s[5] >>> 16) ^
      s[6] ^
      (s[6] << 16) ^
      (s[6] >>> 16) ^
      (s[7] << 16)
    u[7] =
      block[7] ^
      (s[0] & 0xffff0000) ^
      (s[0] << 16) ^
      (s[1] & 0xffff) ^
      (s[1] << 16) ^
      (s[2] >>> 16) ^
      (s[3] << 16) ^
      s[4] ^
      (s[4] >>> 16) ^
      (s[5] << 16) ^
      (s[5] >>> 16) ^
      (s[6] >>> 16) ^
      (s[7] & 0xffff) ^
      (s[7] << 16) ^
      (s[7] >>> 16)

    /* 1 round of the LFSR (a mixing transformation) and xor with <hash> */
    v[0] = this.hash[0] ^ (u[1] << 16) ^ (u[0] >>> 16)
    v[1] = this.hash[1] ^ (u[2] << 16) ^ (u[1] >>> 16)
    v[2] = this.hash[2] ^ (u[3] << 16) ^ (u[2] >>> 16)
    v[3] = this.hash[3] ^ (u[4] << 16) ^ (u[3] >>> 16)
    v[4] = this.hash[4] ^ (u[5] << 16) ^ (u[4] >>> 16)
    v[5] = this.hash[5] ^ (u[6] << 16) ^ (u[5] >>> 16)
    v[6] = this.hash[6] ^ (u[7] << 16) ^ (u[6] >>> 16)
    v[7] =
      this.hash[7] ^
      (u[0] & 0xffff0000) ^
      (u[0] << 16) ^
      (u[1] & 0xffff0000) ^
      (u[1] << 16) ^
      (u[6] << 16) ^
      (u[7] & 0xffff0000) ^
      (u[7] >>> 16)

    /* 61 rounds of LFSR, mixing up hash */
    this.hash[0] =
      (v[0] & 0xffff0000) ^
      (v[0] << 16) ^
      (v[0] >>> 16) ^
      (v[1] >>> 16) ^
      (v[1] & 0xffff0000) ^
      (v[2] << 16) ^
      (v[3] >>> 16) ^
      (v[4] << 16) ^
      (v[5] >>> 16) ^
      v[5] ^
      (v[6] >>> 16) ^
      (v[7] << 16) ^
      (v[7] >>> 16) ^
      (v[7] & 0xffff)
    this.hash[1] =
      (v[0] << 16) ^
      (v[0] >>> 16) ^
      (v[0] & 0xffff0000) ^
      (v[1] & 0xffff) ^
      v[2] ^
      (v[2] >>> 16) ^
      (v[3] << 16) ^
      (v[4] >>> 16) ^
      (v[5] << 16) ^
      (v[6] << 16) ^
      v[6] ^
      (v[7] & 0xffff0000) ^
      (v[7] >>> 16)
    this.hash[2] =
      (v[0] & 0xffff) ^
      (v[0] << 16) ^
      (v[1] << 16) ^
      (v[1] >>> 16) ^
      (v[1] & 0xffff0000) ^
      (v[2] << 16) ^
      (v[3] >>> 16) ^
      v[3] ^
      (v[4] << 16) ^
      (v[5] >>> 16) ^
      v[6] ^
      (v[6] >>> 16) ^
      (v[7] & 0xffff) ^
      (v[7] << 16) ^
      (v[7] >>> 16)
    this.hash[3] =
      (v[0] << 16) ^
      (v[0] >>> 16) ^
      (v[0] & 0xffff0000) ^
      (v[1] & 0xffff0000) ^
      (v[1] >>> 16) ^
      (v[2] << 16) ^
      (v[2] >>> 16) ^
      v[2] ^
      (v[3] << 16) ^
      (v[4] >>> 16) ^
      v[4] ^
      (v[5] << 16) ^
      (v[6] << 16) ^
      (v[7] & 0xffff) ^
      (v[7] >>> 16)
    this.hash[4] =
      (v[0] >>> 16) ^
      (v[1] << 16) ^
      v[1] ^
      (v[2] >>> 16) ^
      v[2] ^
      (v[3] << 16) ^
      (v[3] >>> 16) ^
      v[3] ^
      (v[4] << 16) ^
      (v[5] >>> 16) ^
      v[5] ^
      (v[6] << 16) ^
      (v[6] >>> 16) ^
      (v[7] << 16)
    this.hash[5] =
      (v[0] << 16) ^
      (v[0] & 0xffff0000) ^
      (v[1] << 16) ^
      (v[1] >>> 16) ^
      (v[1] & 0xffff0000) ^
      (v[2] << 16) ^
      v[2] ^
      (v[3] >>> 16) ^
      v[3] ^
      (v[4] << 16) ^
      (v[4] >>> 16) ^
      v[4] ^
      (v[5] << 16) ^
      (v[6] << 16) ^
      (v[6] >>> 16) ^
      v[6] ^
      (v[7] << 16) ^
      (v[7] >>> 16) ^
      (v[7] & 0xffff0000)
    this.hash[6] =
      v[0] ^
      v[2] ^
      (v[2] >>> 16) ^
      v[3] ^
      (v[3] << 16) ^
      v[4] ^
      (v[4] >>> 16) ^
      (v[5] << 16) ^
      (v[5] >>> 16) ^
      v[5] ^
      (v[6] << 16) ^
      (v[6] >>> 16) ^
      v[6] ^
      (v[7] << 16) ^
      v[7]
    this.hash[7] =
      v[0] ^
      (v[0] >>> 16) ^
      (v[1] << 16) ^
      (v[1] >>> 16) ^
      (v[2] << 16) ^
      (v[3] >>> 16) ^
      v[3] ^
      (v[4] << 16) ^
      v[4] ^
      (v[5] >>> 16) ^
      v[5] ^
      (v[6] << 16) ^
      (v[6] >>> 16) ^
      (v[7] << 16) ^
      v[7]
  }

  /**
   * Update block sum and message hash.
   *
   * @param block the 256-bit message block to process
   */

  this.gost_compute_sum_and_hash = function(block) {
    /* compute the 256-bit sum */
    let carry = 0
    let hb = 0

    for (let i = 0; i < 8; i++) {
      hb = this.sum[i] >>> 24
      this.sum[i] = (this.sum[i] & 0x00ffffff) + (block[i] & 0x00ffffff) + carry
      hb = hb + (block[i] >>> 24) + (this.sum[i] >>> 24)
      this.sum[i] = (this.sum[i] & 0x00ffffff) | ((hb & 0xff) << 24)
      carry = (hb & 0x100) != 0 ? 1 : 0
    } /* update message hash */
    this.gost_block_compress(block)
  }

  /**
   * Calculate message hash.
   * Can be called repeatedly with chunks of the message to be hashed.
   *
   * @param _msg message chunk
   * @param _size length of the message chunk
   */

  this.gost_update = function(_msg, _size) {
    const index = this.length & 31
    let msg = _msg,
      pmsg = 0
    let size = _size
    const msg32 = new Array(8)

    this.length += size

    /* fill partial block */
    if (index != 0) {
      const left = 32 - index
      if (size < left) {
        for (var i = 0; i < size; i++) this.message[index + i] = msg[i]
        return
      } else for (var i = 0; i < left; i++) this.message[index + i] = msg[i]

      /* process partitial block */
      for (var i = 0; i < 8; i++)
        msg32[i] =
          (this.message[4 * i] & 0xff) |
          ((this.message[4 * i + 1] & 0xff) << 8) |
          ((this.message[4 * i + 2] & 0xff) << 16) |
          ((this.message[4 * i + 3] & 0xff) << 24)
      this.gost_compute_sum_and_hash(msg32)
      pmsg += left
      size -= left
    }
    while (size >= 32) {
      for (var i = 0; i < 8; i++) {
        this.message[4 * i] = msg[pmsg + 4 * i]
        this.message[4 * i + 1] = msg[pmsg + 4 * i + 1]
        this.message[4 * i + 2] = msg[pmsg + 4 * i + 2]
        this.message[4 * i + 3] = msg[pmsg + 4 * i + 3]
        msg32[i] =
          (this.message[4 * i] & 0xff) |
          ((this.message[4 * i + 1] & 0xff) << 8) |
          ((this.message[4 * i + 2] & 0xff) << 16) |
          ((this.message[4 * i + 3] & 0xff) << 24)
      }
      this.gost_compute_sum_and_hash(msg32)
      pmsg += 32
      size -= 32
    }
    if (size != 0) {
      for (var i = 0; i < size; i++) {
        this.message[i] = msg[pmsg + i]
      }
    }
  }

  /**
   * Finish hashing and store message digest into given array.
   *
   * @param result calculated hash in binary form
   */

  this.gost_final = function() {
    const index = this.length & 31
    const msg32 = new Array(8)

    /* pad the last block with zeroes and hash it */
    if (index > 0) {
      for (var i = 0; i < 32 - index; i++) {
        this.message[index + i] = 0
      }
      for (var i = 0; i < 8; i++) {
        msg32[i] =
          (this.message[4 * i] & 0xff) |
          ((this.message[4 * i + 1] & 0xff) << 8) |
          ((this.message[4 * i + 2] & 0xff) << 16) |
          ((this.message[4 * i + 3] & 0xff) << 24)
      }
      this.gost_compute_sum_and_hash(msg32)
    }

    /* hash the message length and the sum */
    msg32[0] = this.length << 3
    msg32[1] = this.length >>> 29
    for (var i = 2; i < 8; i++) {
      msg32[i] = 0
    }

    this.gost_block_compress(msg32)
    this.gost_block_compress(this.sum)
  }

  /* initialize the lookup tables */

  this.gost_init_table = function() {
    let ax, bx, cx, dx

    for (let a = 0, i = 0; a < 16; a++) {
      ax = this.sbox[1][a] << 15
      bx = this.sbox[3][a] << 23
      cx = this.rol(this.sbox[5][a], 31)
      dx = this.sbox[7][a] << 7

      for (let b = 0; b < 16; b++, i++) {
        this.gost_sbox[0][i] = ax | (this.sbox[0][b] << 11)
        this.gost_sbox[1][i] = bx | (this.sbox[2][b] << 19)
        this.gost_sbox[2][i] = cx | (this.sbox[4][b] << 27)
        this.gost_sbox[3][i] = dx | (this.sbox[6][b] << 3)
      }
    }
  }

  this.gosthash = function(v) {
    const rx = new Array(8)
    const x = this.str2bytes(Utf8.encode(v))
    this.gost_init()
    this.gost_init_table()
    this.gost_update(x, x.length)
    this.gost_final()
    for (let i = 0; i < 8; i++)
      rx[i] =
        this.ch2hex(this.hash[i] & 0xff) +
        this.ch2hex((this.hash[i] >>> 8) & 0xff) +
        this.ch2hex((this.hash[i] >>> 16) & 0xff) +
        this.ch2hex((this.hash[i] >>> 24) & 0xff)
    return rx.join("")
  }

  this.gosthashHex = function(hex) {
    const rx = new Array(8)
    const x = this.hexStr2bytes(hex)
    this.gost_init()
    this.gost_init_table()
    this.gost_update(x, x.length)
    this.gost_final()
    for (let i = 0; i < 8; i++)
      rx[i] =
        this.ch2hex(this.hash[i] & 0xff) +
        this.ch2hex((this.hash[i] >>> 8) & 0xff) +
        this.ch2hex((this.hash[i] >>> 16) & 0xff) +
        this.ch2hex((this.hash[i] >>> 24) & 0xff)
    return rx.join("")
  }
}
