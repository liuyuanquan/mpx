const bindThis = require('../../../lib/template-compiler/bind-this').transform

describe('render function simplify should correct', function () {
  it('should Normal Scope Deletion is correct', function () {
    const input = `
    global.currentInject = {
      render: function () {
        (grade)
        if (random) {
          (name);
        } else {
          (grade)
          name
        }
        
        aName;
        if (random) {
          aName
        }
        
        bName;
        bName;
        if (random) {
          bName
        } else {
          bName
        }
        
        cName;
        if (random) {
          cName;
          dName;
          if (random2) {
            cName;
            dName;
          }
        }
      }
    }
    `
    const res = bindThis(input, { needCollect: true }).code
    const output = `
      global.currentInject = {
        render: function () {
          this._c("grade", this.grade);
      
          if (this._c("random", this.random)) {
            this._c("name", this.name);
          } else {
            this._c("name", this.name);
          }
      
          this._c("aName", this.aName);
      
          if (this._c("random", this.random)) {}
      
          this._c("bName", this.bName);
      
          if (this._c("random", this.random)) {} else {}
      
          this._c("cName", this.cName);
      
          if (this._c("random", this.random)) {
            this._c("dName", this.dName);
      
            if (this._c("random2", this.random2)) {}
          }
        }
      };
    `
    expect(res).toMatchSnapshot(output)
  })

  it('should condition judgment is correct', function () {
    const input = `
      global.currentInject = {
        render: function () {
          name1;
          if (name1) {}
          if (name2) {}
          name2;
          
          name3;
          if (name3 ? 'big' : 'small') {}
          if (name2 ? name3 : 'small') {}
          
          name4;
          if ([name4].length) {}
        }
      }
    `
    const res = bindThis(input, { needCollect: true }).code
    const output = `
      global.currentInject = {
        render: function () {
          if (this._c("name1", this.name1)) {}
  
          if (this._c("name2", this.name2)) {}
  
          if (this._c("name3", this.name3) ? 'big' : 'small') {}
          
          if ([this._c("name4", this.name4)].length) {}
        }
      }
    `
    expect(res).toMatchSnapshot(output)
  })

  it('should expression is correct', function () {
    const input = `
      global.currentInject = {
        render: function () {
          name;
          !name;
          !!name;
          
          name2;
          name3;
          name3[name2];
          
          name44 && name4.length;
          name4['length']
          !name4.length;
          
          $t('xxx');
          this._p($t('xxx'));
          name5;
          this._p(name5);
          
          name6;
          name7;
          name6 + name7;
          
          name8;
          name9;
          ({ key: name8 && !name9 });
          
          // 跨block
          this._p(name10);
          if (xxx) {
            this._p(name10);
            if (name10){}
          }
          if (name10){}

          name11;
          Number(name11); // 删除
          test1(name11); // 保留

          this._p(aa.length);
          this._p(aa);
          this._i(aa, function(item){})
        }
      }
    `
    const res = bindThis(input, { needCollect: true }).code
    const output = `
      global.currentInject = {
        render: function () {
          
        }
      }
    `
    expect(res).toMatchSnapshot(output)
  })

  // 回溯 目前没处理
  it('should backtrack variable deletion is correct', function () {
    const input = `
    global.currentInject = {
      render: function () {
        aName;
        if (aName) {};

        if ( random) {
          bName
        } else {
          bName
        }
        bName
      }
    }
    `
    const res = bindThis(input, { needCollect: true }).code
    const output = `
    global.currentInject = {
      render: function () {
        this._c("aName", this.aName);

        if (this._c("aName", this.aName)) {}
    
        if (this._c("random", this.random)) {
          this._c("bName", this.bName);
        } else {
          this._c("bName", this.bName);
        }
    
        this._c("bName", this.bName);
      }
    };`
    expect(res).toMatchSnapshot(output)
  })

  it('should variable literal is correct', function () {
    // 字面量删除 & 回溯删除前一个
    const input = `
    global.currentInject = {
      render: function () {
        a.b;
        if (a['b']) {}
        c;
        a[c];
        c.d;
        a.b[c.d];
      }
    }`
    const res = bindThis(input, { needCollect: true }).code
    const output = `
    global.currentInject = {
      render: function () {
        if (this._c("a.b", this.a['b'])) {}
  
        this._c("a", this.a)[this._c("c", this.c)];
        this._c("a.b", this.a.b)[this._c("c.d", this.c.d)];
      }
    }`
    expect(res).toMatchSnapshot(output)
  })

  it('should _p is correct', function () {
    const input = `
      global.currentInject = {
        render: function () {
          if (aName) {
            this._p(aName)
          }
          
          this._p(bName)
          if (bName) {}
        }
      }
    `
    const res = bindThis(input, { needCollect: true }).code
    const output = `
      global.currentInject = {
        render: function () {
          if (this._c("name", this.name)) {}

          if (this._c("aName", this.aName)) {}
        }
      }
    `
    expect(res).toMatchSnapshot(output)
  })

  it('should object is correct', function () {
    const input = `
    global.currentInject = {
      render: function () {

        handlerName;
        ({tap:[["handler",true, 123]],click:[["handler",handlerName]]});
  
        aName;
        ({
          open: true,
          str: 'str',
          name: aName
        });
  
        ({
          name: bName
        });
        if (bName) {}
        if (Object.keys({ name: bName }).length) {}
        Object.keys({ name: bName }).length ? bName1 : bName2
      }
    }`
    const res = bindThis(input, { needCollect: true }).code
    const output = `
    global.currentInject = {
      render: function () {
        this._c("handlerName", this.handlerName);
  
        ({
          tap: [["handler", true, 123]],
          click: [["handler"]]
        });
    
        this._c("aName", this.aName);
    
        ({
          open: true,
          str: 'str'
        });
  
        ({});
    
        if (this._c("bName", this.bName)) {}
    
        if (Object.keys({
          name: this._c("bName", this.bName)
        }).length) {}
      }
    }`
    expect(res).toMatchSnapshot(output)
  })

  it('should for loop is correct', function () {
    const input = `
    global.currentInject = {
      render: function () {
      }
    }`
    const res = bindThis(input, { needCollect: true }).code
    const output = `
    global.currentInject = {
      render: function () {
      }
    }`
    expect(res).toMatchSnapshot(output)
  })

  it('should operation is correct', function () {
    const input = `
    global.currentInject = {
      render: function () {
        if((geo || currentLocation)){
          this._p((geo || currentLocation));
        }
        
        if (lang) {}
        (__stringify__.stringifyClass("class_name", { active: !lang }));
        
      }
    }`
    const res = bindThis(input, { needCollect: true }).code
    const output = `
    global.currentInject = {
      render: function () {
      }
    }`
    expect(res).toMatchSnapshot(output)
  })
})
