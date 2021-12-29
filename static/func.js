"use strict";

const data = {
    target: document.getElementById("target"),
    chat: document.getElementById("chat"),
    pos: 0,
    posType: "", // num or op
    formatted: [],
    finished: true,

    getFinal() {
        let newFormatted = [...data.formatted];
        //newFormatted.splice(data.pos, 0, '`<span class="cursor">_</span>`');
        newFormatted.splice(data.pos, 0, '&squ;');

        let final = "`";
        for (let obj of newFormatted) {
            final += obj;
        }
        final += "`";
        return final;
    },

    getFinalForJson() {
        let final = "";
        for (let obj of this.formatted) {
            final += obj;
        }
        return final;
    },

    getFinalForServer() {
        let final = "";
        for (let obj of this.formatted) {
            if (obj == "int(") {
                final += "integrate(";
            } else {
                final += obj;
            }
        }
        return final;
    },

    updateTarget() {
        this.target.innerHTML = this.getFinal();    
    },

    isEmpty() {
        if (this.formatted.length < 1) {
            return true;
        }
        return false;
    },

    lastElContains(arrOfChars) {
        let lastEl = this.formatted[data.pos-1]; 
        for (let char of arrOfChars) {
            if (lastEl == char) {
                return true;
            }
        }
    },

    indexContains(pos, arrOfChars) {
        let elAtIndex = this.formatted[pos];
        for (let char of arrOfChars) {
            if (elAtIndex == char) {
                return true;
            }
        }
    },

    contains(arrOfChars) {
        for (let val of this.formatted) {
            for (let char of arrOfChars) {
                if (val == char) {
                    return true;
                }
            }
        }
    },
};

function moveLeft() {
    if ((data.pos - 1) >= 0) {
        data.pos -= 1;
    }
    update();
}

function moveRight() {
    if ((data.pos + 1) <= data.formatted.length) {
        data.pos += 1;
    }
    update();
}

function removePrev() {
    if (data.pos > 0) {
        data.formatted.splice(data.pos-1, 1);
        data.pos -= 1;
        update();
    }
}

function removeAll() {
    data.pos = 0;
    data.formatted = [];
    update();
}

function update() {
    MathJax.typesetPromise()
    .then(() => {
        data.updateTarget();
        MathJax.typesetPromise();
    }).catch((err) => console.log(err.message));
}


//------------------
// char/num insertion
//-----------------
function insert(num) {
    data.formatted.splice(data.pos, 0, num);
    data.pos++;
    update();
}

// Operations:
function add() {
    if (!data.isEmpty() && !data.lastElContains(['+', '-', '*', '/', '<', '>', '.', '=', '(', '^'])) {
        insert('+');
    }
}

function subtract() {
    if (!data.lastElContains(['+', '-', '*', '.'])) {
        insert('-');
    }
}

function multiply() {
    if (!data.isEmpty() && !data.lastElContains(['+', '-', '*', '/', '<', '>', '.', '=', '(', '^'])) {
        insert('*');
    }
}

function compare(char) {
    if (!data.isEmpty() && !data.contains(['<', '>', '=', '<=', '>=']) && !data.lastElContains(['+', '-', '*', '/', '.', '(', '^'])) {
        insert(char);
    }
}

function dot() {
    if (!data.lastElContains(['.'])) {
        if (data.pos - 1 > 0) {
            let firstIndex = 0;
            for (let i = data.pos - 1; i >= 0; i--) {
                if (data.indexContains(i, ['+', '-', '*', '<', '>', '(', ')', '='])) {
                    firstIndex = i+1;
                    break;
                }
            }

            let isUsed = false;
            for (let j = firstIndex; j < data.formatted.length; j++) {
                if (data.formatted[j] == '.') { 
                    isUsed = true;
                }
            }
               
            if(!isUsed) {
                insert('.');
            }
            return;
        }
        insert('.');
    }
}

function addFunc(type) {
    insert(type + "(");
    insert(")");
    moveLeft();
}

function addP(type) {
    insert(type);
}

function divide() {
    if (!data.isEmpty() && !data.lastElContains(['+', '-', '*', '/', '<', '>', '.', '=', '(', '^'])) {
        insert('/');
        insert('(');
        insert(')');
        moveLeft();
    }
}

function debug() {
    console.log(data.formatted);
    console.log(data.getFinal());
}

function createReqResHtml(text, names) {
    const req = document.createElement("div");
    req.className = names[0];

    const reqInner = document.createElement("div");
    reqInner.className = names[1];

    const textNode = document.createTextNode("`" + text +  "`");

    reqInner.appendChild(textNode);
    req.appendChild(reqInner);

    MathJax.typesetPromise()
    .then(() => {
        data.chat.appendChild(req);
        MathJax.typesetPromise();
    }).catch((err) => console.log(err.message));
}

function calc() {
    createReqResHtml(data.getFinalForJson(), ["request", "req-inner"]);
    const payload = { payload: data.getFinalForServer() };

    fetch('http://localhost:8080/api/calc', {
          method: 'POST',
          body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(jsData => {
        jsData = jsData.replace('integrate', 'int');
        jsData = jsData.replace('√', 'sqrt');
        createReqResHtml(jsData, ["response", "res-inner"]);
    })
    .catch((error) => {
          console.error('Error:', error);
    });
}

window.onload = (event) => {
      update();
};
