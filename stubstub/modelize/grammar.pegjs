{ 
    function resolveIdentifier(id) { 
        if (id && id.type === "identifier" && id.value) { 
            return id.value; 
        } 
        return id;
    }
}

start = ModelBlock*

ModelBlock = _ modelName:Identifier " "? boundName:Identifier? _ "{" _ entries:(ModelBlockEntry)* _ "}" _ {
	const propertyEntries = entries.filter(entry => entry.type === "spread" || entry.type === "keyValuePair");
	const spreads = entries.filter(entry => entry.type === "spread");
    const modelBlocks = entries.filter(entry => entry.type === "modelBlock");
	const identifiers = entries.filter(entry => entry.type === "identifier");
    
	return {
    	type: "modelBlock",
        modelName: resolveIdentifier(modelName),
        boundName: resolveIdentifier(boundName),
        propertyEntries,
		identifiers,
        modelBlocks,
    }
}

ModelBlockEntry = KeyValuePair / ModelBlock / Identifier / Spread;

Spread = "..." value:Parameter {
	return {type: "spread", value };
}

KeyValuePair = _ key:(StringLiteral / Identifier) _ ":" _ value:Expr _ { 
	return {type: "keyValuePair", key: resolveIdentifier(key), value}; 
}

Expr = ModelBlock / Literal / Identifier / Parameter;

Parameter = "$" id:Identifier {
	return {type: "parameter", value: resolveIdentifier(id)}
}

Identifier = id:([A-Za-z_][A-Za-z0-9_]*) { return {type: "identifier", value: id.flat().join("") }; }

Literal
	= Undefined / Null / BooleanLiteral / NumericLiteral / StringLiteral

Undefined
	= "undefined" { return undefined }

Null
	= "null" { return null }

BooleanLiteral
  	= val:("true" / "false") { return val === "true"; }
    
NumericLiteral
	= val:("-"?[0-9]+("."[0-9]+)?) { return parseFloat(val.flat().flat().join("")) }

StringLiteral
 	= '"' chars:DoubleStringCharacter* '"' { return chars.join(''); }
  	/ "'" chars:SingleStringCharacter* "'" { return chars.join(''); }

DoubleStringCharacter
 	= !('"' / "\\") char:. { return char; }
  	/ "\\" sequence:EscapeSequence { return sequence; }

SingleStringCharacter
  	= !("'" / "\\") char:. { return char; }
  	/ "\\" sequence:EscapeSequence { return sequence; }

EscapeSequence
 	= "'"
  	/ '"'
  	/ "\\"
  	/ "b"  { return "\b";   }
  	/ "f"  { return "\f";   }
  	/ "n"  { return "\n";   }
  	/ "r"  { return "\r";   }
  	/ "t"  { return "\t";   }
  	/ "v"  { return "\x0B"; }
    
_ "whitespace"
  = [ \t\n\r]*