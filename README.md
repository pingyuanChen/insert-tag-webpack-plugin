# insert-tag-webpack-plugin
Insert script or link tag to html

## Install
To install the latest release:
```shell
npm install insert-tag-webpack-plugin
```

## Usage
Once insert-tag-webpack-plugin is installed in your project, you can use like this:
```
var InsertTagWebpackPlugin = require('insert-tag-webpack-plugin');

new InsertTagWebpackPlugin({
  filename: 'app/views/list.html',
  destname: 'app/dev-views/list.html',
  chunks: ['common', 'boot']
})

```
