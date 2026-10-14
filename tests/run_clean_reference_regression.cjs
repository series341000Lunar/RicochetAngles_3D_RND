// Preserve the earlier integration evidence while re-running its real browser gates.
const fs=require('fs'),path=require('path'),Module=require('module');
const file=path.join(__dirname,'test_lookdev_browser.cjs'),source=fs.readFileSync(file,'utf8')
  .replace("out=path.join(root,'Docs/global-lookdev')","out=path.join(root,'Docs/clean-lookdev/reference-regression')");
const task=new Module(file,module);task.filename=file;task.paths=module.paths;task._compile(source,file);
