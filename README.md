# lastchaos-classic-emulator

![health-potion](https://github.com/5z3f/lastchaos-classic-emulator/assets/39301116/38fa73b0-ad47-4574-ad67-ca7fa7c9bb92)


# Installation
#### __Set up the Database__
- Import the `lastchaos.sql` file into your **MariaDB** instance. This will set up the necessary database structure for the server.

#### __Configure the Environment__
- Copy `.env` to `.env.local` and update it to your database connection details. 

#### __Install Dependencies__
- Run `npm install` in your terminal. This will install all the necessary dependencies for the project.

#### __Run the Servers__
- `npm run loginserver`
- `npm run gameserver`

# Client Version
This server is currently based on the following client:
| Version | Nation | Release date |
| --- | --- | --- |
| 1107 | USA | 07.2008 |

You can download it [here](https://mega.nz/file/Gy43nbBJ#ZmtL2TLEZbhz7DRGW8VA1Cg5p40r6LdYkWCekZd1bN0).


# Client Installation
#### __Modify Connection Details__
- Update the connection details in the `sl.dta` file. You can do this using the [LastChaosDTA](https://github.com/5z3f/lastchaos-classic-emulator/files/10042812/LastChaosDTA.zip) editor.

    - *__Alternatively, you can download a pre-configured file from [here](https://github.com/5z3f/lastchaos-classic-emulator/files/10030763/sl.zip).__*

#### __Apply Patches__
- Apply the necessary client patches. These can be found in the [Patches](#patches) section of this document.

#### __Launch the Client__
- Run the client by executing the following command: `start bin/Nksp.exe 6574`.

#### __Log In__
- Use the credentials `test`:`test` to log in.

# Tools
### packet-sniffer
`py ./tools/packet-sniffer.py --version <clientVersion> --packdefault <true/false>`

Dumps sent/received packets into `msglog.txt`. The file is saved in your client directory. \
**You need to have Python and Frida installed `pip install frida` to use it.**

### export-packet-definition
`npm run tools/export-packet-definition <jsonfileName> <MessageType.h>`

Export packet definitions from official sources into `.json` file.

### convert-packet-dump
`npm run tools/convert-packet-dump <packetDefinitionsFilePath> <packetDumpFilePath>`

Converts first two bytes (which should be **type** and **subtype**) of every dumped packet in `msglog.txt` file into packet definition names.

- also compatible with `log.txt` created by this [this](https://github.com/5z3f/lastchaos-classic-emulator/files/13848188/packet-dumper.zip) library

# Patches
<div align="center">

| File | Description | Offset(s) | From | To |
| --- | --- | --- | --- | --- |
| Engine.dll | IP Filter Patch | 0x107379 | 3C 3D 75 16 80 3D 29 C1 58 10 68 | E9 EC 03 00 00 90 90 90 90 90 90 |
| Engine.dll | ReceiveFromServerNew() Encryption Patch | 0x11110F | 85 C0 7D 04 33 F6 EB 1F 8B 7B 04 8B C8 8B D1 C1 E9 02 8D B5 0C FC FF FF F3 A5 8B CA 83 E1 03 F3 A4 8B 75 08 89 43 10 | 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 90 |
| Engine.dll | SendToServerNew() Encryption Patch | 0x111295 | 50 8D 4D BC E8 E2 0E 00 00 | 90 90 90 90 90 90 90 90 90 |
| Engine.dll | RenderToolTip() Time Calculation Patch (WORLDTIME_MUL Removal) | 0x22268F, 0x222634, 0x2225DC | 18 | 01 |
| EntitiesMP.dll | SendMyNextMovePosition() Tick Patch (1s -> 100ms) | 0x00ED880 | E8 03 00 00 | 64 00 00 00 |

</div>

You can download the patched game-ready files here:

- [Engine.dll](https://github.com/5z3f/lastchaos-classic-emulator/files/13848183/Engine.zip)
- [EntitiesMP.dll](https://github.com/5z3f/lastchaos-classic-emulator/files/13848182/EntitiesMP.zip)

Replace these files in the `Bin` folder.

# Authors
- [@agsvn](https://github.com/5z3f)
- [@karmel0x](https://github.com/karmel0x)