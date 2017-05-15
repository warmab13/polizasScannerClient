/*! x509-1.1.13.js (c) 2012-2017 Kenji Urushima | kjur.github.com/jsrsasign/license
 */
/*
 * x509.js - X509 class to read subject public key from certificate.
 *
 * Copyright (c) 2010-2017 Kenji Urushima (kenji.urushima@gmail.com)
 *
 * This software is licensed under the terms of the MIT License.
 * http://kjur.github.com/jsrsasign/license
 *
 * The above copyright and license notice shall be
 * included in all copies or substantial portions of the Software.
 */

/**
 * @fileOverview
 * @name x509-1.1.js
 * @author Kenji Urushima kenji.urushima@gmail.com
 * @version x509 1.1.13 (2017-Apr-27)
 * @since jsrsasign 1.x.x
 * @license <a href="http://kjur.github.io/jsrsasign/license/">MIT License</a>
 */

/**
 * hexadecimal X.509 certificate ASN.1 parser class.<br/>
 * @class hexadecimal X.509 certificate ASN.1 parser class
 * @property {RSAKey} subjectPublicKeyRSA Tom Wu's RSAKey object (DEPRECATED from jsrsasign 7.1.4)
 * @property {String} subjectPublicKeyRSA_hN hexadecimal string for modulus of RSA public key (DEPRECATED from jsrsasign 7.1.4)
 * @property {String} subjectPublicKeyRSA_hE hexadecimal string for public exponent of RSA public key (DEPRECATED from jsrsasign 7.1.4)
 * @property {String} hex hexacedimal string for X.509 certificate.
 * @property {Number} version format version (1: X509v1, 3: X509v3, otherwise: unknown) since jsrsasign 7.1.4
 * @author Kenji Urushima
 * @version 1.0.1 (08 May 2012)
 * @see <a href="http://kjur.github.com/jsrsasigns/">'jsrsasign'(RSA Sign JavaScript Library) home page http://kjur.github.com/jsrsasign/</a>
 * @description
 * X509 class provides following functionality:
 * <ul>
 * <li>parse X.509 certificate ASN.1 structure</li>
 * <li>get basic fields, extensions, signature algorithms and signature values</li>
 * <li>read PEM certificate</li>
 * </ul>
 *
 * <ul>
 * <li><b>TO GET FIELDS</b>
 *   <ul>
 *   <li>serial - {@link X509#getSerialNumberHex}</li>
 *   <li>serial - (DEPRECATED) {@link X509.getSerialNumberHex}</li>
 *   <li>signature algorithm field - {@link X509#getSignatureAlgorithmField}</li>
 *   <li>issuer - {@link X509#getIssuerHex}</li>
 *   <li>issuer - {@link X509#getIssuerString}</li>
 *   <li>notBefore - {@link X509#getNotBefore}</li>
 *   <li>notAfter - {@link X509#getNotAfter}</li>
 *   <li>subject - {@link X509#getSubjectHex}</li>
 *   <li>subject - {@link X509#getSubjectString}</li>
 *   <li>subjectPublicKeyInfo - {@link X509#.getPublicKey}</li>
 *   <li>subjectPublicKeyInfo - {@link X509#.getPublicKeyHex}</li>
 *   <li>subjectPublicKeyInfo - {@link X509#.getPublicKeyIdx}</li>
 *   <li>subjectPublicKeyInfo - {@link X509.getPublicKeyFromCertPEM}</li>
 *   <li>subjectPublicKeyInfo - {@link X509.getPublicKeyFromCertHex}</li>
 *   <li>subjectPublicKeyInfo - (DEPRECATED) {@link X509.getSubjectPublicKeyPosFromCertHex}</li>
 *   <li>subjectPublicKeyInfo - (DEPRECATED) {@link X509.getSubjectPublicKeyInfoPosFromCertHex}</li>
 *   <li>subjectPublicKeyInfo - (DEPRECATED) {@link X509.getPublicKeyInfoPosOfCertHEX}</li>
 *   <li>signature algorithm - {@link X509.getSignatureAlgorithmName}</li>
 *   <li>signature value - {@link X509.getSignatureValueHex}</li>
 *   </ul>
 * </li>
 * <li><b>TO GET EXTENSIONS</b>
 *   <ul>
 *   <li>basicConstraints - {@link X509.getExtBasicConstraints}</li>
 *   <li>keyUsage - {@link X509.getExtKeyUsageBin}</li>
 *   <li>keyUsage - {@link X509.getExtKeyUsageString}</li>
 *   <li>subjectKeyIdentifier - {@link X509.getExtSubjectKeyIdentifier}</li>
 *   <li>authorityKeyIdentifier - {@link X509.getExtAuthorityKeyIdentifier}</li>
 *   <li>extKeyUsage - {@link X509.getExtExtKeyUsageName}</li>
 *   <li>subjectAltName - {@link X509.getExtSubjectAltName}</li>
 *   <li>cRLDistributionPoints - {@link X509.getExtCRLDistributionPointsURI}</li>
 *   <li>authorityInfoAccess - {@link X509.getExtAIAInfo}</li>
 *   </ul>
 * </li>
 * <li><b>UTILITIES</b>
 *   <ul>
 *   <li>reading PEM X.509 certificate - {@link X509#readCertPEM}</li>
 *   <li>reading hexadecimal string of X.509 certificate - {@link X509#readCertHex}</li>
 *   <li>get all certificate information - {@link X509#getInfo}</li>
 *   <li>get Base64 from PEM certificate - {@link X509.pemToBase64}</li>
 *   <li>verify signature value - {@link X509.verifySignature}</li>
 *   <li>get hexadecimal string from PEM certificate - {@link X509.pemToHex} (DEPRECATED)</li>
 *   </ul>
 * </li>
 * </ul>
 */
function X509() {
    var _ASN1HEX = ASN1HEX;
    var _X509 = X509;

    this.subjectPublicKeyRSA = null;	// DEPRECATED from jsrsasign 7.1.4
    this.subjectPublicKeyRSA_hN = null;	// DEPRECATED from jsrsasign 7.1.4
    this.subjectPublicKeyRSA_hE = null;	// DEPRECATED from jsrsasign 7.1.4
    this.hex = null;
    this.version = 0; // version (1: X509v1, 3: X509v3, others: unspecified)
    this.foffset = 0; // field index offset (-1: for X509v1, 0: for X509v3)

    // ===== get basic fields from hex =====================================

    /**
     * get format version (X.509v1 or v3 certificate)<br/>
     * @name getVersion
     * @memberOf X509#
     * @function
     * @return {Number} 1 for X509v1, 3 for X509v3, otherwise 0
     * @since jsrsasign 7.1.14 x509 1.1.13
     * @description
     * This method returns a format version of X.509 certificate.
     * It returns 1 for X.509v1 certificate and 3 for v3 certificate.
     * Otherwise returns 0.
     * This method will be automatically called in
     * {@link X509#readCertPEM}. After then, you can use
     * {@link X509.version} parameter.
     * @example
     * var x = new X509();
     * x.readCertPEM(sCertPEM);
     * version = x.getVersion();    // 1 or 3
     * sn = x.getSerialNumberHex(); // return string like "01ad..."
     */
    this.getVersion = function() {
	if (this.hex === null || this.version !== 0) return this.version;

	// check if the first item of tbsCertificate "[0] { INTEGER 2 }"
	if (_ASN1HEX.getTLVbyList(this.hex, 0, [0, 0]) !==
	    "a003020102") {
	    this.version = 1;
	    this.foffset = -1;
	    return 1;
	}

	this.version = 3;
	return 3;
    };

    /**
     * get hexadecimal string of serialNumber field of certificate.<br/>
     * @name getSerialNumberHex
     * @memberOf X509#
     * @function
     * @return {String} hexadecimal string of certificate serial number
     * @example
     * var x = new X509();
     * x.readCertPEM(sCertPEM);
     * var sn = x.getSerialNumberHex(); // return string like "01ad..."
     */
    this.getSerialNumberHex = function() {
	return _ASN1HEX.getVbyList(this.hex, 0, [0, 1 + this.foffset], "02");
    };

    /**
     * get signature algorithm name in basic field
     * @name getSignatureAlgorithmField
     * @memberOf X509#
     * @function
     * @return {String} signature algorithm name (ex. SHA1withRSA, SHA256withECDSA)
     * @since x509 1.1.8
     * @description
     * This method will get a name of signature algorithm field of certificate:
     * @example
     * var x = new X509();
     * x.readCertPEM(sCertPEM);
     * algName = x.getSignatureAlgorithmField();
     */
    this.getSignatureAlgorithmField = function() {
	var sigAlgOidHex = _ASN1HEX.getVbyList(this.hex, 0, [0, 2 + this.foffset, 0], "06");
	var sigAlgOidInt = KJUR.asn1.ASN1Util.oidHexToInt(sigAlgOidHex);
	var sigAlgName = KJUR.asn1.x509.OID.oid2name(sigAlgOidInt);
	return sigAlgName;
    };

    /**
     * get hexadecimal string of issuer field TLV of certificate.<br/>
     * @name getIssuerHex
     * @memberOf X509#
     * @function
     * @return {String} hexadecial string of issuer DN ASN.1
     * @example
     * var x = new X509();
     * x.readCertPEM(sCertPEM);
     * var issuer = x.getIssuerHex(); // return string like "3013..."
     */
    this.getIssuerHex = function() {
	return _ASN1HEX.getTLVbyList(this.hex, 0, [0, 3 + this.foffset], "30");
    };

    /**
     * get string of issuer field of certificate.<br/>
     * @name getIssuerString
     * @memberOf X509#
     * @function
     * @return {String} issuer DN string
     * @example
     * var x = new X509();
     * x.readCertPEM(sCertPEM);
     * var issuer = x.getIssuerString(); // return string like "/C=US/O=TEST"
     */
    this.getIssuerString = function() {
        return _X509.hex2dn(this.getIssuerHex());
    };

    /**
     * get hexadecimal string of subject field of certificate.<br/>
     * @name getSubjectHex
     * @memberOf X509#
     * @function
     * @return {String} hexadecial string of subject DN ASN.1
     * @example
     * var x = new X509();
     * x.readCertPEM(sCertPEM);
     * var subject = x.getSubjectHex(); // return string like "3013..."
     */
    this.getSubjectHex = function() {
	return _ASN1HEX.getTLVbyList(this.hex, 0, [0, 5 + this.foffset], "30");
    };

    /**
     * get string of subject field of certificate.<br/>
     * @name getSubjectString
     * @memberOf X509#
     * @function
     * @return {String} subject DN string
     * @example
     * var x = new X509();
     * x.readCertPEM(sCertPEM);
     * var subject = x.getSubjectString(); // return string like "/C=US/O=TEST"
     */
    this.getSubjectString = function() {
        return _X509.hex2dn(this.getSubjectHex());
    };

    /**
     * get notBefore field string of certificate.<br/>
     * @name getNotBefore
     * @memberOf X509#
     * @function
     * @return {String} not before time value (ex. "151231235959Z")
     * @example
     * var x = new X509();
     * x.readCertPEM(sCertPEM);
     * var notBefore = x.getNotBefore(); // return string like "151231235959Z"
     */
    this.getNotBefore = function() {
        var s = _ASN1HEX.getVbyList(this.hex, 0, [0, 4 + this.foffset, 0]);
        s = s.replace(/(..)/g, "%$1");
        s = decodeURIComponent(s);
        return s;
    };

    /**
     * get notAfter field string of certificate.<br/>
     * @name getNotAfter
     * @memberOf X509#
     * @function
     * @return {String} not after time value (ex. "151231235959Z")
     * @example
     * var x = new X509();
     * x.readCertPEM(sCertPEM);
     * var notAfter = x.getNotAfter(); // return string like "151231235959Z"
     */
    this.getNotAfter = function() {
	var s = _ASN1HEX.getVbyList(this.hex, 0, [0, 4 + this.foffset, 1]);
        s = s.replace(/(..)/g, "%$1");
        s = decodeURIComponent(s);
        return s;
    };

    /**
     * get a hexadecimal string of subjectPublicKeyInfo field.<br/>
     * @name getPublicKeyHex
     * @memberOf X509#
     * @function
     * @return {String} ASN.1 SEQUENCE hexadecimal string of subjectPublicKeyInfo field
     * @since jsrsasign 7.1.4 x509 1.1.13
     * @example
     * x = new X509();
     * x.readCertPEM(sCertPEM);
     * hSPKI = x.getPublicKeyHex(); // return string like "30820122..."
     */
    this.getPublicKeyHex = function() {
	return _ASN1HEX.getTLVbyList(this.hex, 0, [0, 6 + this.foffset], "30");
    };

    /**
     * get a string index of subjectPublicKeyInfo field for hexadecimal string certificate.<br/>
     * @name getPublicKeyIdx
     * @memberOf X509#
     * @function
     * @return {Number} string index of subjectPublicKeyInfo field for hexadecimal string certificate.
     * @since jsrsasign 7.1.4 x509 1.1.13
     * @example
     * x = new X509();
     * x.readCertPEM(sCertPEM);
     * idx = x.getPublicKeyIdx(); // return string index in x.hex parameter
     */
    this.getPublicKeyIdx = function() {
	return _ASN1HEX.getIdxbyList(this.hex, 0, [0, 6 + this.foffset], "30");
    };

    /**
     * get a RSAKey/ECDSA/DSA public key object of subjectPublicKeyInfo field.<br/>
     * @name getPublicKey
     * @memberOf X509#
     * @function
     * @return {Object} RSAKey/ECDSA/DSA public key object of subjectPublicKeyInfo field
     * @since jsrsasign 7.1.4 x509 1.1.13
     * @example
     * x = new X509();
     * x.readCertPEM(sCertPEM);
     * pubkey= x.getPublicKey();
     */
    this.getPublicKey = function() {
	return KEYUTIL.getKey(this.getPublicKeyHex(), null, "pkcs8pub");
    };

    // ===== read certificate =====================================
    /**
     * read PEM formatted X.509 certificate from string.<br/>
     * @name readCertPEM
     * @memberOf X509#
     * @function
     * @param {String} sCertPEM string for PEM formatted X.509 certificate
     * @example
     * x = new X509();
     * x.readCertPEM(sCertPEM); // read certificate
     */
    this.readCertPEM = function(sCertPEM) {
        this.readCertHex(_ASN1HEX.pemToHex(sCertPEM));
    };

    /**
     * read a hexadecimal string of X.509 certificate<br/>
     * @name readCertHex
     * @memberOf X509#
     * @function
     * @param {String} sCertHex hexadecimal string of X.509 certificate
     * @since jsrsasign 7.1.4 x509 1.1.13
     * @example
     * x = new X509();
     * x.readCertHex("3082..."); // read certificate
     */
    this.readCertHex = function(sCertHex) {
        this.hex = sCertHex;
	this.getVersion(); // set version parameter
	pubkey = this.getPublicKey();

	// deprecated field settings. will remove this block after 8.0.0
	if (pubkey instanceof RSAKey) { 
            this.subjectPublicKeyRSA = pubkey;
            this.subjectPublicKeyRSA_hN = hextoposhex(pubkey.n.toString(16));
            this.subjectPublicKeyRSA_hE = hextoposhex(pubkey.e.toString(16));
	}
    };

    // DEPRECATED. will remove after 8.0.0
    this.readCertPEMWithoutRSAInit = function(sCertPEM) {
        var hCert = _ASN1HEX.pemToHex(sCertPEM);
        var a = _X509.getPublicKeyHexArrayFromCertHex(hCert);
        if (typeof this.subjectPublicKeyRSA.setPublic === "function") {
            this.subjectPublicKeyRSA.setPublic(a[0], a[1]);
        }
        this.subjectPublicKeyRSA_hN = a[0];
        this.subjectPublicKeyRSA_hE = a[1];
        this.hex = hCert;
    };

    /**
     * get certificate information as string.<br/>
     * @name getInfo
     * @memberOf X509#
     * @function
     * @return {String} certificate information string
     * @since jsrsasign 5.0.10 x509 1.1.8
     * @example
     * x = new X509();
     * x.readCertPEM(certPEM);
     * console.log(x.getInfo());
     * // this shows as following
     * Basic Fields
     *   serial number: 02ac5c266a0b409b8f0b79f2ae462577
     *   signature algorithm: SHA1withRSA
     *   issuer: /C=US/O=DigiCert Inc/OU=www.digicert.com/CN=DigiCert High Assurance EV Root CA
     *   notBefore: 061110000000Z
     *   notAfter: 311110000000Z
     *   subject: /C=US/O=DigiCert Inc/OU=www.digicert.com/CN=DigiCert High Assurance EV Root CA
     *   subject public key info:
     *     key algorithm: RSA
     *     n=c6cce573e6fbd4bb...
     *     e=10001
     * X509v3 Extensions:
     *   keyUsage CRITICAL:
     *     digitalSignature,keyCertSign,cRLSign
     *   basicConstraints CRITICAL:
     *     cA=true
     *   subjectKeyIdentifier :
     *     b13ec36903f8bf4701d498261a0802ef63642bc3
     *   authorityKeyIdentifier :
     *     kid=b13ec36903f8bf4701d498261a0802ef63642bc3
     * signature algorithm: SHA1withRSA
     * signature: 1c1a0697dcd79c9f...
     */
    this.getInfo = function() {
	var _X509 = X509;
	var s, pubkey, aExt;
	s  = "Basic Fields\n";
        s += "  serial number: " + this.getSerialNumberHex() + "\n";
	s += "  signature algorithm: " + this.getSignatureAlgorithmField() + "\n";
	s += "  issuer: " + this.getIssuerString() + "\n";
	s += "  notBefore: " + this.getNotBefore() + "\n";
	s += "  notAfter: " + this.getNotAfter() + "\n";
	s += "  subject: " + this.getSubjectString() + "\n";
	s += "  subject public key info: " + "\n";

	// subject public key info
	pubkey = this.getPublicKey();
	s += "    key algorithm: " + pubkey.type + "\n";

	if (pubkey.type === "RSA") {
	    s += "    n=" + hextoposhex(pubkey.n.toString(16)).substr(0, 16) + "...\n";
	    s += "    e=" + hextoposhex(pubkey.e.toString(16)) + "\n";
	}

        s += "X509v3 Extensions:\n";

	aExt = _X509.getV3ExtInfoListOfCertHex(this.hex);
        for (var i = 0; i < aExt.length; i++) {
	    var info = aExt[i];

	    // show extension name and critical flag
	    var extName = KJUR.asn1.x509.OID.oid2name(info["oid"]);
	    if (extName === '') extName = info["oid"];

	    var critical = '';
	    if (info["critical"] === true) critical = "CRITICAL";

	    s += "  " + extName + " " + critical + ":\n";

	    // show extension value if supported
	    if (extName === "basicConstraints") {
		var bc = _X509.getExtBasicConstraints(this.hex);
		if (bc.cA === undefined) {
		    s += "    {}\n";
		} else {
		    s += "    cA=true";
		    if (bc.pathLen !== undefined)
			s += ", pathLen=" + bc.pathLen;
		    s += "\n";
		}
	    } else if (extName === "keyUsage") {
		s += "    " + _X509.getExtKeyUsageString(this.hex) + "\n";
	    } else if (extName === "subjectKeyIdentifier") {
		s += "    " + _X509.getExtSubjectKeyIdentifier(this.hex) + "\n";
	    } else if (extName === "authorityKeyIdentifier") {
		var akid = _X509.getExtAuthorityKeyIdentifier(this.hex);
		if (akid.kid !== undefined)
		    s += "    kid=" + akid.kid + "\n";
	    } else if (extName === "extKeyUsage") {
		var eku = _X509.getExtExtKeyUsageName(this.hex);
		s += "    " + eku.join(", ") + "\n";
	    } else if (extName === "subjectAltName") {
		var san = _X509.getExtSubjectAltName(this.hex);
		s += "    " + san.join(", ") + "\n";
	    } else if (extName === "cRLDistributionPoints") {
		var cdp = _X509.getExtCRLDistributionPointsURI(this.hex);
		s += "    " + cdp + "\n";
	    } else if (extName === "authorityInfoAccess") {
		var aia = _X509.getExtAIAInfo(this.hex);
		if (aia.ocsp !== undefined)
		    s += "    ocsp: " + aia.ocsp.join(",") + "\n";
		if (aia.caissuer !== undefined)
		    s += "    caissuer: " + aia.caissuer.join(",") + "\n";
	    }
        }

	s += "signature algorithm: " + _X509.getSignatureAlgorithmName(this.hex) + "\n";
	s += "signature: " + _X509.getSignatureValueHex(this.hex).substr(0, 16) + "...\n";
	return s;
    };
};

/**
 * get Base64 string from PEM certificate string
 * @name pemToBase64
 * @memberOf X509
 * @function
 * @param {String} sCertPEM PEM formatted RSA/ECDSA/DSA X.509 certificate
 * @return {String} Base64 string of PEM certificate
 * @example
 * b64 = X509.pemToBase64(certPEM);
 */
X509.pemToBase64 = function(sCertPEM) {
    var s = sCertPEM;
    s = s.replace("-----BEGIN CERTIFICATE-----", "");
    s = s.replace("-----END CERTIFICATE-----", "");
    s = s.replace(/[ \n]+/g, "");
    return s;
};

/**
 * (DEPRECATED) get a hexa decimal string from PEM certificate string
 * @name pemToHex
 * @memberOf X509
 * @function
 * @param {String} sCertPEM PEM formatted RSA/ECDSA/DSA X.509 certificate
 * @return {String} hexadecimal string of PEM certificate
 * @deprecated from x509 1.1.11 jsrsasign 7.0.1. please move to {@link ASN1HEX.pemToHex}
 * @description
 * CAUTION: now X509.pemToHex deprecated and is planed to remove in jsrsasign 8.0.0.
 * @example
 * hex = X509.pemToHex(certPEM);
 */
X509.pemToHex = function(sCertPEM) {
    return ASN1HEX.pemToHex(sCertPEM);
};

/**
 * (DEPRECATED) get a string index of contents of subjectPublicKeyInfo BITSTRING value from hexadecimal certificate<br/>
 * @name getSubjectPublicKeyPosFromCertHex
 * @memberOf X509
 * @function
 * @param {String} hexadecimal string of DER RSA/ECDSA/DSA X.509 certificate
 * @return {Integer} string index of key contents
 * @deprecated from x509 1.1.13 jsrsasign 7.1.14. This static method will be removed in 8.0.0 release.
 * @example
 * idx = X509.getSubjectPublicKeyPosFromCertHex("3082...");
 */
// NOTE: Without BITSTRING encapsulation.
X509.getSubjectPublicKeyPosFromCertHex = function(hCert) {
    var pInfo = X509.getSubjectPublicKeyInfoPosFromCertHex(hCert);
    if (pInfo == -1) return -1;
    var a = ASN1HEX.getPosArrayOfChildren_AtObj(hCert, pInfo);
    if (a.length != 2) return -1;
    var pBitString = a[1];
    if (hCert.substring(pBitString, pBitString + 2) != '03') return -1;
    var pBitStringV = ASN1HEX.getStartPosOfV_AtObj(hCert, pBitString);

    if (hCert.substring(pBitStringV, pBitStringV + 2) != '00') return -1;
    return pBitStringV + 2;
};

/**
 * (DEPRECATED) get a string index of subjectPublicKeyInfo field from hexadecimal certificate<br/>
 * @name getSubjectPublicKeyInfoPosFromCertHex
 * @memberOf X509
 * @function
 * @param {String} hexadecimal string of DER RSA/ECDSA/DSA X.509 certificate
 * @return {Integer} string index of subjectPublicKeyInfo field
 * @deprecated since jsrsasign 7.1.14 x509 1.1.13. This will be removed in 8.0.0 release.
 * @description
 * This static method gets a string index of subjectPublicKeyInfo field from hexadecimal certificate.<br/>
 * NOTE1: privateKeyUsagePeriod field of X509v2 not supported.<br/>
 * NOTE2: X.509v1 and X.509v3 certificate are supported.<br/>
 * @example
 * idx = X509.getSubjectPublicKeyInfoPosFromCertHex("3082...");
 */
X509.getSubjectPublicKeyInfoPosFromCertHex = function(hCert) {
    var x = new X509();
    x.readCertHex(hCert);
    return x.getPublicKeyIdx();
};

/**
 * (DEPRECATED) get an array of N and E for RSA subject public key in HEX certificate<br/>
 * @name getPublicKeyHexArrayFromCertHex
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of RSA X.509 certificate
 * @return {Array} array of N and E parameter of RSA subject public key
 * @deprecated since jsrsasign 7.1.14 x509 1.1.13. This will be removed in 8.0.0 release.
 */
X509.getPublicKeyHexArrayFromCertHex = function(hCert) {
    var _ASN1HEX = ASN1HEX;
    var p, a, hN, hE;
    p = X509.getSubjectPublicKeyPosFromCertHex(hCert);
    a = _ASN1HEX.getPosArrayOfChildren_AtObj(hCert, p);
    if (a.length != 2) return [];
    hN = _ASN1HEX.getHexOfV_AtObj(hCert, a[0]);
    hE = _ASN1HEX.getHexOfV_AtObj(hCert, a[1]);
    if (hN != null && hE != null) {
        return [hN, hE];
    } else {
        return [];
    }
};

X509.getHexTbsCertificateFromCert = function(hCert) {
    var pTbsCert = ASN1HEX.getStartPosOfV_AtObj(hCert, 0);
    return pTbsCert;
};

/**
 * (DEPRECATED) get an array of N and E for RSA subject public key in PEM certificate<br/>
 * @name getPublicKeyHexArrayFromCertHex
 * @memberOf X509
 * @function
 * @param {String} sCertPEM PEM string of RSA X.509 certificate
 * @return {Array} array of N and E parameter of RSA subject public key
 * @deprecated since jsrsasign 7.1.14 x509 1.1.13. This will be removed in 8.0.0 release.
 */
X509.getPublicKeyHexArrayFromCertPEM = function(sCertPEM) {
    var hCert = ASN1HEX.pemToHex(sCertPEM);
    var a = X509.getPublicKeyHexArrayFromCertHex(hCert);
    return a;
};

/**
 * get distinguished name string in OpenSSL online format from hexadecimal string of ASN.1 DER X.500 name<br/>
 * @name hex2dn
 * @memberOf X509
 * @function
 * @param {String} hex hexadecimal string of ASN.1 DER distinguished name
 * @param {Integer} idx index of hexadecimal string (DEFAULT=0)
 * @return {String} OpenSSL online format distinguished name
 * @description
 * This static method converts from a hexadecimal string of 
 * distinguished name (DN)
 * specified by 'hex' and 'idx' to OpenSSL oneline string representation (ex. /C=US/O=a).
 * @example
 * X509.hex2dn("3031310b3...") &rarr; /C=US/O=a/CN=b2+OU=b1
 */
X509.hex2dn = function(hex, idx) {
    if (idx === undefined) idx = 0;
    if (hex.substr(idx, 2) !== "30") throw "malformed DN";

    var a = new Array();

    var aIdx = ASN1HEX.getPosArrayOfChildren_AtObj(hex, idx);
    for (var i = 0; i < aIdx.length; i++) {
	a.push(X509.hex2rdn(hex, aIdx[i]));
    }

    a = a.map(function(s) { return s.replace("/", "\\/"); });
    return "/" + a.join("/");
};

/**
 * get relative distinguished name string in OpenSSL online format from hexadecimal string of ASN.1 DER RDN<br/>
 * @name hex2rdn
 * @memberOf X509
 * @function
 * @param {String} hex hexadecimal string of ASN.1 DER concludes relative distinguished name
 * @param {Integer} idx index of hexadecimal string (DEFAULT=0)
 * @return {String} OpenSSL online format relative distinguished name
 * @description
 * This static method converts from a hexadecimal string of 
 * relative distinguished name (RDN)
 * specified by 'hex' and 'idx' to LDAP string representation (ex. O=test+CN=test).<br/>
 * NOTE: Multi-valued RDN is supported since jsnrsasign 6.2.2 x509 1.1.10.
 * @example
 * X509.hex2rdn("310a3008060355040a0c0161") &rarr; O=a
 * X509.hex2rdn("31143008060355040a0c01613008060355040a0c0162") &rarr; O=a+O=b
 */
X509.hex2rdn = function(hex, idx) {
    if (idx === undefined) idx = 0;
    if (hex.substr(idx, 2) !== "31") throw "malformed RDN";

    var a = new Array();

    var aIdx = ASN1HEX.getPosArrayOfChildren_AtObj(hex, idx);
    for (var i = 0; i < aIdx.length; i++) {
	a.push(X509.hex2attrTypeValue(hex, aIdx[i]));
    }

    a = a.map(function(s) { return s.replace("+", "\\+"); });
    return a.join("+");
};

/**
 * get string from hexadecimal string of ASN.1 DER AttributeTypeAndValue<br/>
 * @name hex2attrTypeValue
 * @memberOf X509
 * @function
 * @param {String} hex hexadecimal string of ASN.1 DER concludes AttributeTypeAndValue
 * @param {Integer} idx index of hexadecimal string (DEFAULT=0)
 * @return {String} string representation of AttributeTypeAndValue (ex. C=US)
 * @description
 * This static method converts from a hexadecimal string of AttributeTypeAndValue
 * specified by 'hex' and 'idx' to LDAP string representation (ex. C=US).
 * @example
 * X509.hex2attrTypeValue("3008060355040a0c0161") &rarr; O=a
 * X509.hex2attrTypeValue("300806035504060c0161") &rarr; C=a
 * X509.hex2attrTypeValue("...3008060355040a0c0161...", 128) &rarr; O=a
 */
X509.hex2attrTypeValue = function(hex, idx) {
    var _ASN1HEX = ASN1HEX;
    if (idx === undefined) idx = 0;
    if (hex.substr(idx, 2) !== "30") throw "malformed attribute type and value";

    var aIdx = _ASN1HEX.getPosArrayOfChildren_AtObj(hex, idx);
    if (aIdx.length !== 2 || hex.substr(aIdx[0], 2) !== "06")
	"malformed attribute type and value";

    var oidHex = _ASN1HEX.getHexOfV_AtObj(hex, aIdx[0]);
    var oidInt = KJUR.asn1.ASN1Util.oidHexToInt(oidHex);
    var atype = KJUR.asn1.x509.OID.oid2atype(oidInt);

    var hV = _ASN1HEX.getHexOfV_AtObj(hex, aIdx[1]);
    var rawV = hextorstr(hV);

    return atype + "=" + rawV;
};

/**
 * get RSA/DSA/ECDSA public key object from X.509 certificate hexadecimal string<br/>
 * @name getPublicKeyFromCertHex
 * @memberOf X509
 * @function
 * @param {String} h hexadecimal string of X.509 certificate for RSA/ECDSA/DSA public key
 * @return returns RSAKey/KJUR.crypto.{ECDSA,DSA} object of public key
 * @since jsrasign 7.1.0 x509 1.1.11
 */
X509.getPublicKeyFromCertHex = function(h) {
    var x = new X509();
    x.readCertHex(h);
    return x.getPublicKey();
};

/**
 * get RSA/DSA/ECDSA public key object from PEM certificate string
 * @name getPublicKeyFromCertPEM
 * @memberOf X509
 * @function
 * @param {String} sCertPEM PEM formatted RSA/ECDSA/DSA X.509 certificate
 * @return returns RSAKey/KJUR.crypto.{ECDSA,DSA} object of public key
 * @since x509 1.1.1
 * @description
 * NOTE: DSA is also supported since x509 1.1.2.
 */
X509.getPublicKeyFromCertPEM = function(sCertPEM) {
    var x = new X509();
    x.readCertPEM(sCertPEM);
    return x.getPublicKey();
};

/**
 * get public key information from PEM certificate
 * @name getPublicKeyInfoPropOfCertPEM
 * @memberOf X509
 * @function
 * @param {String} sCertPEM string of PEM formatted certificate
 * @return {Hash} hash of information for public key
 * @since x509 1.1.1
 * @description
 * Resulted associative array has following properties:<br/>
 * <ul>
 * <li>algoid - hexadecimal string of OID of asymmetric key algorithm</li>
 * <li>algparam - hexadecimal string of OID of ECC curve name or null</li>
 * <li>keyhex - hexadecimal string of key in the certificate</li>
 * </ul>
 * NOTE: X509v1 certificate is also supported since x509.js 1.1.9.
 */
X509.getPublicKeyInfoPropOfCertPEM = function(sCertPEM) {
    var _ASN1HEX = ASN1HEX;
    var result = {};
    var x, hSPKI, pubkey;
    result.algparam = null;

    x = new X509();
    x.readCertPEM(sCertPEM);

    hSPKI = x.getPublicKeyHex();
    result.keyhex = _ASN1HEX.getVbyList(hSPKI, 0, [1], "03").substr(2);
    result.algoid = _ASN1HEX.getVbyList(hSPKI, 0, [0, 0], "06");

    if (result.algoid === "2a8648ce3d0201") { // ecPublicKey
	result.algparam = _ASN1HEX.getVbyList(hSPKI, 0, [0, 1], "06");
    };

    return result;
};

/**
 * (DEPRECATED) static method to get position of subjectPublicKeyInfo field from HEX certificate
 * @name getPublicKeyInfoPosOfCertHEX
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of certificate
 * @return {Integer} position in hexadecimal string
 * @since x509 1.1.4
 * @deprecated from x509 1.1.13 jsrsasign 7.1.14.
 * @description
 * get position for SubjectPublicKeyInfo field in the hexadecimal string of
 * certificate.
 */
X509.getPublicKeyInfoPosOfCertHEX = function(hCert) {
    var x = new X509();
    x.readCertHex(hCert);
    return x.getPublicKeyIdx();
};

/**
 * get array of X.509 V3 extension value information in hex string of certificate
 * @name getV3ExtInfoListOfCertHex
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of X.509 certificate binary
 * @return {Array} array of result object by {@link X509.getV3ExtInfoListOfCertHex}
 * @since x509 1.1.5
 * @description
 * This method will get all extension information of a X.509 certificate.
 * Items of resulting array has following properties:
 * <ul>
 * <li>posTLV - index of ASN.1 TLV for the extension. same as 'pos' argument.</li>
 * <li>oid - dot noted string of extension oid (ex. 2.5.29.14)</li>
 * <li>critical - critical flag value for this extension</li>
 * <li>posV - index of ASN.1 TLV for the extension value.
 * This is a position of a content of ENCAPSULATED OCTET STRING.</li>
 * </ul>
 * @example
 * hCert = ASN1HEX.pemToHex(certGithubPEM);
 * a = X509.getV3ExtInfoListOfCertHex(hCert);
 * // Then a will be an array of like following:
 * [{posTLV: 1952, oid: "2.5.29.35", critical: false, posV: 1968},
 *  {posTLV: 1974, oid: "2.5.29.19", critical: true, posV: 1986}, ...]
 */
X509.getV3ExtInfoListOfCertHex = function(hCert) {
    // 1. find index for SEQUENCE in v3 extension field ("[3]")
    var extSeqIdx = ASN1HEX.getIdxbyList(hCert, 0, [0, 7, 0], "30");
    var a4 = ASN1HEX.getPosArrayOfChildren_AtObj(hCert, extSeqIdx);

    // 2. v3Extension item position
    var numExt = a4.length;
    var aInfo = new Array(numExt);
    for (var i = 0; i < numExt; i++) {
	aInfo[i] = X509.getV3ExtItemInfo_AtObj(hCert, a4[i]);
    }
    return aInfo;
};

/**
 * get X.509 V3 extension value information at the specified position<br/>
 * @name getV3ExtItemInfo_AtObj
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of X.509 certificate binary
 * @param {Integer} pos index of hexadecimal string for the extension
 * @return {Object} properties for the extension
 * @since x509 1.1.5
 * @description
 * This method will get some information of a X.509 V extension
 * which is referred by an index of hexadecimal string of X.509
 * certificate.
 * Resulting object has following properties:
 * <ul>
 * <li>posTLV - index of ASN.1 TLV for the extension. same as 'pos' argument.</li>
 * <li>oid - dot noted string of extension oid (ex. 2.5.29.14)</li>
 * <li>critical - critical flag value for this extension</li>
 * <li>posV - index of ASN.1 TLV for the extension value.
 * This is a position of a content of ENCAPSULATED OCTET STRING.</li>
 * </ul>
 * This method is used by {@link X509.getV3ExtInfoListOfCertHex} internally.
 */
X509.getV3ExtItemInfo_AtObj = function(hCert, pos) {
    var _ASN1HEX = ASN1HEX;
    var info = {};

    // posTLV - extension TLV
    info.posTLV = pos;

    var a  = _ASN1HEX.getPosArrayOfChildren_AtObj(hCert, pos);
    if (a.length != 2 && a.length != 3)
        throw "malformed X.509v3 Ext (code:001)"; // oid,(critical,)val

    // oid - extension OID
    if (hCert.substr(a[0], 2) != "06")
        throw "malformed X.509v3 Ext (code:002)"; // not OID "06"
    var valueHex = _ASN1HEX.getHexOfV_AtObj(hCert, a[0]);
    info.oid = _ASN1HEX.hextooidstr(valueHex);

    // critical - extension critical flag
    info.critical = false; // critical false by default
    if (a.length == 3) info.critical = true;

    // posV - content TLV position of encapsulated
    //        octet string of V3 extension value.
    var posExtV = a[a.length - 1];
    if (hCert.substr(posExtV, 2) != "04")
        throw "malformed X.509v3 Ext (code:003)"; // not EncapOctet "04"
    info.posV = _ASN1HEX.getStartPosOfV_AtObj(hCert, posExtV);

    return info;
};

/**
 * get X.509 V3 extension value ASN.1 TLV for specified oid or name
 * @name getHexOfTLV_V3ExtValue
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of X.509 certificate binary
 * @param {String} oidOrName oid or name for extension (ex. 'keyUsage' or '2.5.29.15')
 * @return {String} hexadecimal string of extension ASN.1 TLV
 * @since x509 1.1.6
 * @description
 * This method will get X.509v3 extension value of ASN.1 TLV
 * which is specifyed by extension name or oid.
 * If there is no such extension in the certificate, it returns null.
 * @example
 * hExtValue = X509.getHexOfTLV_V3ExtValue(hCert, "keyUsage");
 * // hExtValue will be such like '030205a0'.
 */
X509.getHexOfTLV_V3ExtValue = function(hCert, oidOrName) {
    var pos = X509.getPosOfTLV_V3ExtValue(hCert, oidOrName);
    if (pos == -1) return null;
    return ASN1HEX.getHexOfTLV_AtObj(hCert, pos);
};

/**
 * get X.509 V3 extension value ASN.1 V for specified oid or name
 * @name getHexOfV_V3ExtValue
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of X.509 certificate binary
 * @param {String} oidOrName oid or name for extension (ex. 'keyUsage' or '2.5.29.15')
 * @return {String} hexadecimal string of extension ASN.1 TLV
 * @since x509 1.1.6
 * @description
 * This method will get X.509v3 extension value of ASN.1 value
 * which is specifyed by extension name or oid.
 * If there is no such extension in the certificate, it returns null.
 * Available extension names and oids are defined
 * in the {@link KJUR.asn1.x509.OID} class.
 * @example
 * hExtValue = X509.getHexOfV_V3ExtValue(hCert, "keyUsage");
 * // hExtValue will be such like '05a0'.
 */
X509.getHexOfV_V3ExtValue = function(hCert, oidOrName) {
    var pos = X509.getPosOfTLV_V3ExtValue(hCert, oidOrName);
    if (pos == -1) return null;
    return ASN1HEX.getHexOfV_AtObj(hCert, pos);
};

/**
 * get index in the certificate hexa string for specified oid or name specified extension
 * @name getPosOfTLV_V3ExtValue
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of X.509 certificate binary
 * @param {String} oidOrName oid or name for extension (ex. 'keyUsage' or '2.5.29.15')
 * @return {Integer} index in the hexadecimal string of certficate for specified extension
 * @since x509 1.1.6
 * @description
 * This method will get X.509v3 extension value of ASN.1 V(value)
 * which is specifyed by extension name or oid.
 * If there is no such extension in the certificate,
 * it returns -1.
 * Available extension names and oids are defined
 * in the {@link KJUR.asn1.x509.OID} class.
 * @example
 * idx = X509.getPosOfV_V3ExtValue(hCert, "keyUsage");
 * // The 'idx' will be index in the string for keyUsage value ASN.1 TLV.
 */
X509.getPosOfTLV_V3ExtValue = function(hCert, oidOrName) {
    var oid = oidOrName;
    if (! oidOrName.match(/^[0-9.]+$/)) {
	oid = KJUR.asn1.x509.OID.name2oid(oidOrName);
    }
    if (oid == '') return -1;

    var infoList = X509.getV3ExtInfoListOfCertHex(hCert);
    for (var i = 0; i < infoList.length; i++) {
	var info = infoList[i];
	if (info.oid == oid) return info.posV;
    }
    return -1;
};

/* ======================================================================
 *   Specific V3 Extensions
 * ====================================================================== */

/**
 * get BasicConstraints extension value as object in the certificate
 * @name getExtBasicConstraints
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of X.509 certificate binary
 * @return {Object} associative array which may have "cA" and "pathLen" parameters
 * @since x509 1.1.7
 * @description
 * This method will get basic constraints extension value as object with following paramters.
 * <ul>
 * <li>cA - CA flag whether CA or not</li>
 * <li>pathLen - maximum intermediate certificate length</li>
 * </ul>
 * There are use cases for return values:
 * <ul>
 * <li>{cA:true, pathLen:3} - cA flag is true and pathLen is 3</li>
 * <li>{cA:true} - cA flag is true and no pathLen</li>
 * <li>{} - basic constraints has no value in case of end entity certificate</li>
 * <li>null - there is no basic constraints extension</li>
 * </ul>
 * @example
 * obj = X509.getExtBasicConstraints(hCert);
 */
X509.getExtBasicConstraints = function(hCert) {
    var hBC = X509.getHexOfV_V3ExtValue(hCert, "basicConstraints");
    if (hBC === null) return null;
    if (hBC === '') return {};
    if (hBC === '0101ff') return { "cA": true };
    if (hBC.substr(0, 8) === '0101ff02') {
	var pathLexHex = ASN1HEX.getHexOfV_AtObj(hBC, 6);
	var pathLen = parseInt(pathLexHex, 16);
	return { "cA": true, "pathLen": pathLen };
    }
    throw "unknown error";
};

X509.KEYUSAGE_NAME = [
    "digitalSignature",
    "nonRepudiation",
    "keyEncipherment",
    "dataEncipherment",
    "keyAgreement",
    "keyCertSign",
    "cRLSign",
    "encipherOnly",
    "decipherOnly"
];

/**
 * get KeyUsage extension value as binary string in the certificate
 * @name getExtKeyUsageBin
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of X.509 certificate binary
 * @return {String} binary string of key usage bits (ex. '101')
 * @since x509 1.1.6
 * @description
 * This method will get key usage extension value
 * as binary string such like '101'.
 * Key usage bits definition is in the RFC 5280.
 * If there is no key usage extension in the certificate,
 * it returns empty string (i.e. '').
 * @example
 * bKeyUsage = X509.getExtKeyUsageBin(hCert);
 * // bKeyUsage will be such like '101'.
 * // 1 - digitalSignature
 * // 0 - nonRepudiation
 * // 1 - keyEncipherment
 */
X509.getExtKeyUsageBin = function(hCert) {
    var hKeyUsage = X509.getHexOfV_V3ExtValue(hCert, "keyUsage");
    if (hKeyUsage == '') return '';
    if (hKeyUsage.length % 2 != 0 || hKeyUsage.length <= 2)
	throw "malformed key usage value";
    var unusedBits = parseInt(hKeyUsage.substr(0, 2));
    var bKeyUsage = parseInt(hKeyUsage.substr(2), 16).toString(2);
    return bKeyUsage.substr(0, bKeyUsage.length - unusedBits);
};

/**
 * get KeyUsage extension value as names in the certificate
 * @name getExtKeyUsageString
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of X.509 certificate binary
 * @return {String} comma separated string of key usage
 * @since x509 1.1.6
 * @description
 * This method will get key usage extension value
 * as comma separated string of usage names.
 * If there is no key usage extension in the certificate,
 * it returns empty string (i.e. '').
 * @example
 * sKeyUsage = X509.getExtKeyUsageString(hCert);
 * // sKeyUsage will be such like 'digitalSignature,keyEncipherment'.
 */
X509.getExtKeyUsageString = function(hCert) {
    var bKeyUsage = X509.getExtKeyUsageBin(hCert);
    var a = new Array();
    for (var i = 0; i < bKeyUsage.length; i++) {
	if (bKeyUsage.substr(i, 1) == "1") a.push(X509.KEYUSAGE_NAME[i]);
    }
    return a.join(",");
};

/**
 * get subjectKeyIdentifier value as hexadecimal string in the certificate
 * @name getExtSubjectKeyIdentifier
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of X.509 certificate binary
 * @return {String} hexadecimal string of subject key identifier or null
 * @since jsrsasign 5.0.10 x509 1.1.8
 * @description
 * This method will get subject key identifier extension value
 * as hexadecimal string.
 * If there is no its extension in the certificate,
 * it returns null.
 * @example
 * skid = X509.getExtSubjectKeyIdentifier(hCert);
 */
X509.getExtSubjectKeyIdentifier = function(hCert) {
    var hSKID = X509.getHexOfV_V3ExtValue(hCert, "subjectKeyIdentifier");
    return hSKID;
};

/**
 * get authorityKeyIdentifier value as JSON object in the certificate
 * @name getExtAuthorityKeyIdentifier
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of X.509 certificate binary
 * @return {Object} JSON object of authority key identifier or null
 * @since jsrsasign 5.0.10 x509 1.1.8
 * @description
 * This method will get authority key identifier extension value
 * as JSON object.
 * If there is no its extension in the certificate,
 * it returns null.
 * <br>
 * NOTE: Currently this method only supports keyIdentifier so that
 * authorityCertIssuer and authorityCertSerialNumber will not
 * be return in the JSON object.
 * @example
 * akid = X509.getExtAuthorityKeyIdentifier(hCert);
 * // returns following JSON object
 * { kid: "1234abcd..." }
 */
X509.getExtAuthorityKeyIdentifier = function(hCert) {
    var result = {};
    var hAKID = X509.getHexOfTLV_V3ExtValue(hCert, "authorityKeyIdentifier");
    if (hAKID === null) return null;

    var a = ASN1HEX.getPosArrayOfChildren_AtObj(hAKID, 0);
    for (var i = 0; i < a.length; i++) {
	if (hAKID.substr(a[i], 2) === "80")
	    result.kid = ASN1HEX.getHexOfV_AtObj(hAKID, a[i]);
    }

    return result;
};

/**
 * get extKeyUsage value as array of name string in the certificate
 * @name getExtExtKeyUsageName
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of X.509 certificate binary
 * @return {Object} array of extended key usage ID name or oid
 * @since jsrsasign 5.0.10 x509 1.1.8
 * @description
 * This method will get extended key usage extension value
 * as array of name or OID string.
 * If there is no its extension in the certificate,
 * it returns null.
 * <br>
 * NOTE: Supported extended key usage ID names are defined in
 * name2oidList parameter in asn1x509.js file.
 * @example
 * eku = X509.getExtExtKeyUsageName(hCert);
 * // returns following array:
 * ["serverAuth", "clientAuth", "0.1.2.3.4.5"]
 */
X509.getExtExtKeyUsageName = function(hCert) {
    var result = new Array();
    var h = X509.getHexOfTLV_V3ExtValue(hCert, "extKeyUsage");
    if (h === null) return null;

    var a = ASN1HEX.getPosArrayOfChildren_AtObj(h, 0);
    for (var i = 0; i < a.length; i++) {
	var hex = ASN1HEX.getHexOfV_AtObj(h, a[i]);
	var oid = KJUR.asn1.ASN1Util.oidHexToInt(hex);
	var name = KJUR.asn1.x509.OID.oid2name(oid);
	result.push(name);
    }

    return result;
};

/**
 * get subjectAltName value as array of string in the certificate
 * @name getExtSubjectAltName
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of X.509 certificate binary
 * @return {Object} array of alt names
 * @since jsrsasign 5.0.10 x509 1.1.8
 * @description
 * This method will get subject alt name extension value
 * as array of name.
 * If there is no its extension in the certificate,
 * it returns null.
 * <br>
 * NOTE: Currently this method supports only dNSName so that
 * other name type such like iPAddress or generalName will not be returned.
 * @example
 * san = X509.getExtSubjectAltName(hCert);
 * // returns following array:
 * ["example.com", "example.org"]
 */
X509.getExtSubjectAltName = function(hCert) {
    var result = new Array();
    var h = X509.getHexOfTLV_V3ExtValue(hCert, "subjectAltName");

    var a = ASN1HEX.getPosArrayOfChildren_AtObj(h, 0);
    for (var i = 0; i < a.length; i++) {
	if (h.substr(a[i], 2) === "82") {
	    var fqdn = hextoutf8(ASN1HEX.getHexOfV_AtObj(h, a[i]));
	    result.push(fqdn);
	}
    }

    return result;
};

/**
 * get array of string for fullName URIs in cRLDistributionPoints(CDP) in the certificate
 * @name getExtCRLDistributionPointsURI
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of X.509 certificate binary
 * @return {Object} array of fullName URIs of CDP of the certificate
 * @since jsrsasign 5.0.10 x509 1.1.8
 * @description
 * This method will get all fullName URIs of cRLDistributionPoints extension
 * in the certificate as array of URI string.
 * If there is no its extension in the certificate,
 * it returns null.
 * <br>
 * NOTE: Currently this method supports only fullName URI so that
 * other parameters will not be returned.
 * @example
 * cdpuri = X509.getExtCRLDistributionPointsURI(hCert);
 * // returns following array:
 * ["http://example.com/aaa.crl", "http://example.org/aaa.crl"]
 */
X509.getExtCRLDistributionPointsURI = function(hCert) {
    var _ASN1HEX = ASN1HEX;
    var result = new Array();
    var h = X509.getHexOfTLV_V3ExtValue(hCert, "cRLDistributionPoints");

    var a = _ASN1HEX.getPosArrayOfChildren_AtObj(h, 0);
    for (var i = 0; i < a.length; i++) {
	var hDP = _ASN1HEX.getHexOfTLV_AtObj(h, a[i]);

	var a1 = _ASN1HEX.getPosArrayOfChildren_AtObj(hDP, 0);
	for (var j = 0; j < a1.length; j++) {
	    if (hDP.substr(a1[j], 2) === "a0") {
		var hDPN = _ASN1HEX.getHexOfV_AtObj(hDP, a1[j]);
		if (hDPN.substr(0, 2) === "a0") {
		    var hFullName = _ASN1HEX.getHexOfV_AtObj(hDPN, 0);
		    if (hFullName.substr(0, 2) === "86") {
			var hURI = _ASN1HEX.getHexOfV_AtObj(hFullName, 0);
			var uri = hextoutf8(hURI);
			result.push(uri);
		    }
		}
	    }
	}
    }

    return result;
};

/**
 * get AuthorityInfoAccess extension value in the certificate as associative array
 * @name getExtAIAInfo
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of X.509 certificate binary
 * @return {Object} associative array of AIA extension properties
 * @since x509 1.1.6
 * @description
 * This method will get authority info access value
 * as associate array which has following properties:
 * <ul>
 * <li>ocsp - array of string for OCSP responder URL</li>
 * <li>caissuer - array of string for caIssuer value (i.e. CA certificates URL)</li>
 * </ul>
 * If there is no key usage extension in the certificate,
 * it returns null;
 * @example
 * oAIA = X509.getExtAIAInfo(hCert);
 * // result will be such like:
 * // oAIA.ocsp = ["http://ocsp.foo.com"];
 * // oAIA.caissuer = ["http://rep.foo.com/aaa.p8m"];
 */
X509.getExtAIAInfo = function(hCert) {
    var result = {};
    result.ocsp = [];
    result.caissuer = [];
    var pos1 = X509.getPosOfTLV_V3ExtValue(hCert, "authorityInfoAccess");
    if (pos1 == -1) return null;
    if (hCert.substr(pos1, 2) != "30") // extnValue SEQUENCE
	throw "malformed AIA Extn Value";

    var posAccDescList = ASN1HEX.getPosArrayOfChildren_AtObj(hCert, pos1);
    for (var i = 0; i < posAccDescList.length; i++) {
	var p = posAccDescList[i];
	var posAccDescChild = ASN1HEX.getPosArrayOfChildren_AtObj(hCert, p);
	if (posAccDescChild.length != 2)
	    throw "malformed AccessDescription of AIA Extn";
	var pOID = posAccDescChild[0];
	var pName = posAccDescChild[1];
	if (ASN1HEX.getHexOfV_AtObj(hCert, pOID) == "2b06010505073001") {
	    if (hCert.substr(pName, 2) == "86") {
		result.ocsp.push(hextoutf8(ASN1HEX.getHexOfV_AtObj(hCert, pName)));
	    }
	}
	if (ASN1HEX.getHexOfV_AtObj(hCert, pOID) == "2b06010505073002") {
	    if (hCert.substr(pName, 2) == "86") {
		result.caissuer.push(hextoutf8(ASN1HEX.getHexOfV_AtObj(hCert, pName)));
	    }
	}
    }
    return result;
};

/**
 * get signature algorithm name from hexadecimal certificate data
 * @name getSignatureAlgorithmName
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of X.509 certificate binary
 * @return {String} signature algorithm name (ex. SHA1withRSA, SHA256withECDSA)
 * @since x509 1.1.7
 * @description
 * This method will get signature algorithm name of certificate:
 * @example
 * algName = X509.getSignatureAlgorithmName(hCert);
 */
X509.getSignatureAlgorithmName = function(hCert) {
    var sigAlgOidHex = ASN1HEX.getVbyList(hCert, 0, [1, 0], "06");
    var sigAlgOidInt = KJUR.asn1.ASN1Util.oidHexToInt(sigAlgOidHex);
    var sigAlgName = KJUR.asn1.x509.OID.oid2name(sigAlgOidInt);
    return sigAlgName;
};

/**
 * get signature value in hexadecimal string<br/>
 * @name getSignatureValueHex
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of X.509 certificate binary
 * @return {String} signature value hexadecimal string without BitString unused bits
 * @since x509 1.1.7
 * @description
 * This method will get signature value of certificate:
 * @example
 * sigHex = X509.getSignatureValueHex(hCert);
 */
X509.getSignatureValueHex = function(hCert) {
    return ASN1HEX.getVbyList(hCert, 0, [2], "03", true);
};

/**
 * (DEPRECATED) static method to get hexadecimal string of serialNumber field of certificate.<br/>
 * @name getSerialNumberHex
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of X.509 certificate binary
 * @return {String} hexadecimal string of certificate serial number
 * @deprecated from x509 1.1.13 jsrsasign 7.1.4. please use {@link X509#getSerialNumberHex}
 * @example
 * sn = X509.getSerialNumberHex("3082...");
 */
X509.getSerialNumberHex = function(hCert) {
    var x = new X509();
    x.readCertHex(hCert);
    return x.getSerialNumberHex();
};

/**
 * verifies signature value by public key<br/>
 * @name verifySignature
 * @memberOf X509
 * @function
 * @param {String} hCert hexadecimal string of X.509 certificate binary
 * @param {Object} pubKey public key object
 * @return {Boolean} true if signature value is valid otherwise false
 * @since jsrsasign 7.1.1 x509 1.1.12
 * @description
 * This method verifies signature value of hexadecimal string of 
 * X.509 certificate by specified public key object.
 * @example
 * pubKey = KEYUTIL.getKey(pemPublicKey); // or certificate
 * hCert = ASN1HEX.pemToHex(pemCert);
 * isValid = X509.verifySignature(hCert, pubKey);
 */
X509.verifySignature = function(hCert, pubKey) {
    var algName = X509.getSignatureAlgorithmName(hCert);
    var hSigVal = X509.getSignatureValueHex(hCert);
    var hTbsCert = ASN1HEX.getTLVbyList(hCert, 0, [0], "30");

    var sig = new KJUR.crypto.Signature({alg: algName});
    sig.init(pubKey);
    sig.updateHex(hTbsCert);
    return sig.verify(hSigVal);
};
