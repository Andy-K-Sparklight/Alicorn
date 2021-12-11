"use strict";const{promisify}=require("util"),Client=require("../client"),{buildMockDispatch}=require("./mock-utils"),{kDispatches,kMockAgent,kClose,kOriginalClose,kOrigin,kOriginalDispatch,kConnected}=require("./mock-symbols"),{MockInterceptor}=require("./mock-interceptor"),Symbols=require("../core/symbols"),{InvalidArgumentError}=require("../core/errors");class MockClient extends Client{constructor(e,i){if(super(e,i),!i||!i.agent||"function"!=typeof i.agent.dispatch)throw new InvalidArgumentError("Argument opts.agent must implement Agent");this[kMockAgent]=i.agent,this[kOrigin]=e,this[kDispatches]=[],this[kConnected]=1,this[kOriginalDispatch]=this.dispatch,this[kOriginalClose]=this.close.bind(this),this.dispatch=buildMockDispatch.call(this),this.close=this[kClose]}get[Symbols.kConnected](){return this[kConnected]}intercept(e){return new MockInterceptor(e,this[kDispatches])}async[kClose](){await promisify(this[kOriginalClose])(),this[kConnected]=0,this[kMockAgent][Symbols.kClients].delete(this[kOrigin])}}module.exports=MockClient;