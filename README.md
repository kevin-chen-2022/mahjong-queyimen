## 缺一门-血战到底

本人才疏学浅，对麻将所知不多，只是在前几天的陪练中逐渐熟悉了成都麻将-缺一门（又叫血战到底）的基础玩法，所以编写的这个工具就是围绕缺一门而展开，至于其他类型的麻将玩法，总体上差别不大，所以也应当具有一定的参考价值。

为了便于使用，本工具基于H5网页制作，采取三标签布局，对应三个核心功能区：定制选牌、手牌分析、牌型浏览。彼此之间可自由切换、灵活跳转。

### 选牌

分两个部分：图案选牌和文本输入。

#### 1、点击图案

图案选牌最常用，它是模拟实体麻将形象，用户用鼠标点击或手指触摸牌面即可将其选中（变色显示）。同一张牌最多选中4次，用角标数字（蓝底白字）表明一张牌的选中次数。如果点击一次角标，就可减少一次选中，角标数字小于1则选中状态消失，非常直观便捷。

#### 2、文本输入

至于文字输入选牌（格式: w=万, t/p=筒, s=条，如 w1234t5678s123），一般很少使用，保留它主要是为了和国际接轨，因为专业人士之间切磋习惯用这种方式。

无论采取哪种方式选牌，彼此之间都是实时联动更新：用户既可以从“确定选牌”和“确定输入”的角标数字上知晓已选的麻将总数，同时选中的牌也进入了手牌显示区，并在手牌标签页显示出来。

![image.png](https://cdn2.flowus.cn/oss/f4a7efe8-f19b-4767-a01d-551a6fd45715/image.png?time=1785239100&token=d2cfb1f3967e576ef2260dde3bd61f67a17a0cbb60a5d7f7c253a6198c4aac67&role=free)

### 手牌

手牌标签页顶部有快捷按钮，可随机生成13张牌（判断是否听牌）、14张牌（判断如何舍牌）。

由于13张牌是训练重点，工具中还提供快捷方式生成一进听牌、二进听牌，以及已经听牌的牌型。

已经听牌的牌型是通过“N面听牌”按钮实现，用户可通过下拉框选择是生成听1-9面牌型，还是“随机”生成听牌牌型。

此功能区的核心是当前手牌显示区，此处为手牌提供了丰富实用的多种操作选项。包括：手牌拖拽排序、手牌变色标注、手牌删除、手牌补牌、分析选牌、最佳舍牌等，下面截图演示。

#### 1、补牌删牌

![image.png](https://cdn2.flowus.cn/oss/22a4474a-3e2f-4a82-ab26-a00cd677d2d2/image.png?time=1785239100&token=15f79bb887a2cc127e7d46ae2e771521ed0d41f73fdbce5be0b0aa97a798c284&role=free)

![image.png](https://cdn2.flowus.cn/oss/a8f89614-ecfb-4649-8371-08eed9dc76f9/image.png?time=1785239100&token=003a9f66ac9cfb3adad7fe358ffcd62921023ebbafe27816d9cc2681ed8ce7c8&role=free)

#### 2、手牌标注

![image.png](https://cdn2.flowus.cn/oss/9a80bbb9-9648-41de-8e81-4bfa996a6559/image.png?time=1785239100&token=b15be7c077a9d365f38d314901efee63cb42f36853fea7144ec8df461611f5b3&role=free)

#### 3、向听判断

在手牌为1、4、7、10、13张时，可以判断当前向听状态、是否听牌。如果听牌，点击听牌详情，可生成胡牌组合直观对照。

3-1、一进听牌

![image.png](https://cdn2.flowus.cn/oss/f9c33b1a-4a13-445c-87eb-391173cbd3be/image.png?time=1785239100&token=46bdd0da8bd536712716991f6587141666b1526a2cb84d66f578eaf347f38a14&role=free)

3-2、听牌牌型

![image.png](https://cdn2.flowus.cn/oss/0a1b79ec-7cd1-4a12-ba49-fc9acaacd873/image.png?time=1785239100&token=e60b683dea908f5491a66ebe34570333e01e9ff1e4ca06ff24711540cacefb1b&role=free)

#### 4、最佳舍牌

在手牌为2、5、8、11、14张时，可判断打出哪张为最佳舍牌。

![image.png](https://cdn2.flowus.cn/oss/1ec47415-94f8-4e79-a96e-4df92bf27c3f/image.png?time=1785239100&token=2c205349104259d6f2783f5f27a52681fbcaf46386527f8cc6dcc3309a597c00&role=free)

#### 5、手动舍牌

判断手动舍牌是否符合牌效率，这特别适合模拟打牌，训练出牌质量。

![image.png](https://cdn2.flowus.cn/oss/e0e508c7-1495-4081-80a6-e2ebfe37c50a/image.png?time=1785239100&token=71da1d6830cd37bcb033ecabf450483f811eca562378df2e2c5eacc73ce02b16&role=free)

#### 6、保存牌组

如果中意的手牌组合，可以点击“保存”，加上说明文字，存入本地数据库，方便以后浏览复盘。

![image.png](https://cdn2.flowus.cn/oss/77b2720d-17f9-4884-adee-01bee74beffd/image.png?time=1785239100&token=cf45c696166e0f5beddf9bee0c835422d15c7b48cfd9d076f8a733439f4724df&role=free)

#### 7、撤销重做

手牌操作带撤销重做功能，下拉框中有一个简要的历史记录可供回溯。

![image.png](https://cdn2.flowus.cn/oss/77623fae-e513-4503-a676-60799859dbb3/image.png?time=1785239100&token=61d5353e4980c45c87f0049676a048e40b26408e3f8c0615e604cbc1cfdfa80b&role=free)



### 牌组库

可以在手牌标签页把中意的牌组保存到本地数据库中，本地数据库可以浏览、修改、分享、查找、导入导出。这是帮助麻友积累经验、提升技能的大本营。

#### 1、设置显示范围

![image.png](https://cdn2.flowus.cn/oss/30676841-cd79-47a7-ba15-8175a8347448/image.png?time=1785239100&token=de5a602604527678c6839e57303e74ceac60435e503c832c748524939c1f487e&role=free)

#### 2、搜索关键词

![image.png](https://cdn2.flowus.cn/oss/fbdcada6-fbf6-4b00-b669-2f1ccc6c4864/image.png?time=1785239100&token=53f984629ea05f6210011c0e7a6b3304c8060fd267b4aa30fdd30188ef24b7cb&role=free)

#### 3、分享-单条记录

3-1、复制单条记录

![image.png](https://cdn2.flowus.cn/oss/52dc05de-9e4c-44fc-9400-b9b1405239ca/image.png?time=1785239100&token=0e5fe1f7c507af98eecb6a279f5bdfa90477c5f5c291b89a4e3dcb2cee56aa8c&role=free)

![image.png](https://cdn2.flowus.cn/oss/b39d0e18-208c-4c04-a7ef-02b3d49dafe5/image.png?time=1785239100&token=020e98283a4adfc3e5da9bf24dcb87c97fd4d8a19735fe162e5b22bc4c8287c6&role=free)

3-2、粘贴单条记录

![image.png](https://cdn2.flowus.cn/oss/29156d86-9817-4c0b-b808-e77155fe47da/image.png?time=1785239100&token=be32aa3ef7bd663f5b512dce6479eac2e8b2034ea6734ff16f3ae5a75dd7dcf8&role=free)

![image.png](https://cdn2.flowus.cn/oss/e42f365c-e55f-485e-bddd-091b30c603fc/image.png?time=1785239100&token=e9e85a94533ec38572e8bcb8bab218cbac2084806bbc4a54af1d01439809924c&role=free)

#### 4、导入导出数据库

可以把整个数据库导出为本地文件（json格式），也可从本地文件中导入数据库（自动判断数据有效性并去重保存）。该功能可以实现跨设备分享牌组数据。

4-1、导出数据库

![image.png](https://cdn2.flowus.cn/oss/78a09e24-6440-438c-9b23-98b300170023/image.png?time=1785239100&token=98ff99a86f907ded46492a9a1581882c91f9e218e920558b68d6f43098e05b2b&role=free)

![image.png](https://cdn2.flowus.cn/oss/ba7d3e33-6079-44e8-b716-b2ab41d3b7c6/image.png?time=1785239100&token=34f5df695ae1708082d64ca4ef6514fca365c16274acdb36afcfabd30a002329&role=free)

4-2、导入数据库

![image.png](https://cdn2.flowus.cn/oss/8e6071cd-be7f-4017-89a2-7df5e7b494a5/image.png?time=1785239100&token=65f3cac5c83e34c77ae29c58be20ac7ed657d86d785f1e2024553bde1f0f3649&role=free)

## 写在最后

开发本工具的初衷原本是方便提升自己的麻将技能，但其中迭代也花费了不少心血。考虑到肯定还有其他麻友像我一样也苦于找不到合适的工具提升功力，于是决定将其分享给广大有缘朋友，毕竟，独乐乐不如众乐乐。

文件：

麻将训练 v1.0.exe （默认窗口：900✖️700像素）

麻将训练 v1.00.apk

温馨提示：

exe是单文件便携版，采用Tauri打包，无需安装，下载到windows电脑中直接双击运行。

apk是安卓版本，采用Capacitor打包，下载到手机上直接安装。

其他操作提示，请点击工具界面顶部的“使用说明”。如果觉得好用，可以在作者信息处扫码请他喝一杯咖啡，谢谢。



