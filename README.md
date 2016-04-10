#gw2api-tools

**NOTE: This repository is no longer maintained! Please use [GW2Treasures/gw2tools](https://github.com/GW2Treasures/gw2tools) instead. Thanks.**


A collection of helpful stuff for use with the [GW2-API](https://forum-en.guildwars2.com/forum/community/api/API-Documentation).
Note: this project has been split into multiple projects over time:
- [Guild Wars 2 WikiMaps](https://github.com/codemasher/Guild-Wars-2-WikiMaps)
- [GW2 Database](https://github.com/codemasher/gw2-database)
- [GW2 WvW Stats](https://github.com/codemasher/gw2-wvwstats)

## Requirements
- A local webserver like [XAMPP](http://www.apachefriends.org/xampp.html) is helpful ;)
- **PHP 5.4+**
- **MySQL** or **MariaDB**

###Why PHP 5.4+?
There's actually no specific reason except for the [fancy javascript/perl style shorthand array syntax](http://php.net/manual/en/language.types.array.php). You're fine with 5.2 if you change that.

##Installation
- download the source and unzip it into a directory within your webroot
- create tables in your database with the given SQL if needed
- open your webbrowser and point it to any file in the /examples folder

##Additional files
- [Guild emblems](http://gw2.chillerlan.net/files/guild-emblems.zip)
- [WvW map tiles and icons](http://gw2.chillerlan.net/files/wvw-maps.zip)
- [GW2 Location sender (setup)](http://gw2.chillerlan.net/files/files/GW2LocationSender-setup.exe)
For the C++ code of the GW2 Location sender hop over to [Heimdall's repo](https://gw2apicpp.codeplex.com/) at codeplex

##Thanks

Thanks go out to the friendly and helpful [GW2 developer community](https://forum-en.guildwars2.com/forum/community/api/), especially for help, input and ideas:
- Cliff Spradlin, ArenaNet Programmer
- Darthmaim
- Dr Ishmael.9685
- Heimdall.4510
- Killer Rhino.6794
- Moturdrn.2837
- Think.8042
- zeeZ.5713

##License

This work is available under the [WTFPL](http://www.wtfpl.net/).
Graphics (c) [ArenaNet](http://www.guildwars2.com/).
