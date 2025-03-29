/*

frida -p (ps StreetsOfRogue).id -l aa.py.js
frida -f StreetsOfRogue.exe -l ff.js

*/
const MONO_DLL = "mono-2.0-bdwgc.dll";

const debuggerAgent = Memory.allocAnsiString("--debugger-agent=transport=dt_socket,server=y,address=127.0.0.1:55555,suspend=n")
var MONO_DEBUG_ARG = Memory.alloc(0x10)
MONO_DEBUG_ARG.writePointer(debuggerAgent)		

var mono_debug_init_call
var mono_debug_enabled_call
var mono_jit_parse_options_call


Interceptor.attach(Module.getExportByName(null, 'LoadLibraryW'), {
	onEnter: function (args) {
		var f = args[0].readUtf16String()
		//console.log("LoadLibraryW",f)
		if(f.includes(MONO_DLL))
		{
			this.is_1=1
		}
	},
	onLeave: function (retval) {
		if(this.is_1)
		{
			hookMono()
		}
	}
});


function hookMono()
{
	var mono_jit_init_version = Module.findExportByName(MONO_DLL,"mono_jit_init_version")
	var mono_debug_init_address = Module.findExportByName(MONO_DLL,"mono_debug_init")
	var mono_jit_parse_options = Module.findExportByName(MONO_DLL,"mono_jit_parse_options")


	mono_debug_init_call = new NativeFunction(Module.findExportByName(MONO_DLL,"mono_debug_init"), 'void', ['int32']);
	mono_debug_enabled_call = new NativeFunction(Module.findExportByName(MONO_DLL,"mono_debug_enabled"), 'uint32', []);
	mono_jit_parse_options_call = new NativeFunction(Module.findExportByName(MONO_DLL,"mono_jit_parse_options"), 'void', ['int32','pointer']);
			

	Interceptor.attach(mono_jit_init_version, {
		onEnter: function (args) {			
			mono_jit_parse_options_call(0x1, MONO_DEBUG_ARG)
			
			if(mono_debug_enabled_call()!=1)
			{
				mono_debug_init_call(1)			
			}
		
		},
		onLeave: function (retval) {
		}
	});

}

 
