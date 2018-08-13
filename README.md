This is McSlinky, Chance Agency's customized version of Inky!

We made this to help us write Neo Cab, and so a lot of our changes from the original Inky may not be beneficial for the game you're making. But take a look around and borrow freely if something seems helpful!

McSlinky is just a small set of extensions on top of Inkle's fantastic Inky editor. Contributors include:
@robinsloan, @hoverbird, @amc, @gingeranyhow and @notbrunoagain

![](resources/icon-small.jpg)

You'll probably want to refer to the original Inky README [here](https://github.com/inkle/inky).


[Download the latest release](http://www.github.com/inkle/inky/releases/latest)

## Implementation details

Inky is built using:

* [Electron](http://electron.atom.io/), a framework by GitHub to build cross-platform Desktop app using HTML, CSS and JavaScript.
* [Ace](https://ace.c9.io/#nav=about), a full-featured code editor built for the web.
* [Photon](http://photonkit.com/), for some of the components. However, the dependency could probably be removed, since its only used for small portions of the CSS.

Inky includes a copy of **inklecate**, the command line **ink** compiler.

## Help develop Inky!

Take a look at the [issues page](https://github.com/inkle/inky/issues) for an issue with a "help wanted" label. We try to provide some basic instructions on how to get started with the development of the feature whenever we add the label.

To build the project:

* Install [node.js](https://nodejs.org/en/) if you don't already have it
* Clone the repo
* On Mac, double-click the `INSTALL_AND_RUN.command` script. On Windows, open Powershell, cd into the app directory, and type `npm install`, then `npm start`.
* For subsequent runs, if no npm packages have changed, you can run the `RUN.command` script on Mac, or type `npm start` in the shell (on Windows).

### Linux

Tested on a fresh **Ubuntu 16.04 LTS** VM installation (_equivalent processes should work for other distributions_)

* Install build tools

`sudo apt-get install -y dkms build-essential linux-headers-generic linux-headers-$(uname -r)`

* Pre-requisites

`sudo apt install git`

`sudo apt install curl`

* Install node and npm

`curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -`

`sudo apt-get install -y nodejs`

* Install mono as per http://www.mono-project.com/download/stable/#download-lin

`sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF`

`echo "deb http://download.mono-project.com/repo/ubuntu stable-xenial main" | sudo tee /etc/apt/sources.list.d/mono-official-stable.list`

`sudo apt-get update`

`sudo apt-get install mono-complete`

* Clone the inky repo

`git clone https://github.com/chanceagency/mcslinky.git`

* Test inklecate_win with mono (_should output usage info_)

`mono app/main-process/ink/inklecate_win.exe`

* Install and run inky

`./INSTALL_AND_RUN.command`

* For subsequent runs, if no npm packages have changed, launch inky as below (otherwise re-run previous step):

`./RUN.command`

## License

**McSlinky**, like Inky, is released under the MIT license.

### The MIT License (MIT)
Copyright (c) 2016 inkle Ltd.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

-

*Inky is named after a black cat based in Cambridge, UK.*

*Soy Inky was named after soy ink, which is made from soy beans. It's the kind of ink Robin uses with his Risograph.*

*McSlinky is named, well, for vanity.*
