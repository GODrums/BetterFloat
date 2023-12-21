type PatternType = {
    [skin: string]: {
        [weapon: string]: {
            [pattern: string]:
                | number
                | {
                      img: string;
                      rank: number;
                  };
        };
    };
};

const patterns: PatternType = {
    crimson_kimono: {
        gloves: {
            458: 1,
            515: 1,
            559: 1,
            560: 1,
            684: 1,
            692: 1,
            699: 1,
            932: 1,
            6: 2,
            79: 2,
            80: 2,
            115: 2,
            208: 2,
            215: 2,
            241: 2,
            290: 2,
            330: 2,
            385: 2,
            402: 2,
            491: 2,
            498: 2,
            698: 2,
            721: 2,
            753: 2,
            841: 2,
            842: 2,
            866: 2,
            958: 2,
            968: 2,
            26: 3,
            37: 3,
            52: 3,
            81: 3,
            91: 3,
            92: 3,
            102: 3,
            129: 3,
            130: 3,
            147: 3,
            152: 3,
            155: 3,
            182: 3,
            183: 3,
            184: 3,
            209: 3,
            224: 3,
            232: 3,
            233: 3,
            285: 3,
            305: 3,
            317: 3,
            329: 3,
            357: 3,
            394: 3,
            447: 3,
            467: 3,
            497: 3,
            516: 3,
            576: 3,
            587: 3,
            591: 3,
            592: 3,
            655: 3,
            656: 3,
            679: 3,
            731: 3,
            875: 3,
            881: 3,
            891: 3,
            892: 3,
            916: 3,
            930: 3,
            931: 3,
            952: 3,
            953: 3,
            954: 3,
            957: 3,
            973: 3,
            1: 4,
            2: 4,
            3: 4,
            32: 4,
            36: 4,
            45: 4,
            62: 4,
            67: 4,
            71: 4,
            78: 4,
            90: 4,
            101: 4,
            122: 4,
            123: 4,
            151: 4,
            161: 4,
            162: 4,
            185: 4,
            205: 4,
            228: 4,
            237: 4,
            257: 4,
            279: 4,
            288: 4,
            306: 4,
            307: 4,
            308: 4,
            333: 4,
            334: 4,
            335: 4,
            347: 4,
            410: 4,
            440: 4,
            441: 4,
            442: 4,
            461: 4,
            462: 4,
            463: 4,
            556: 4,
            575: 4,
            577: 4,
            590: 4,
            601: 4,
            602: 4,
            613: 4,
            647: 4,
            657: 4,
            658: 4,
            732: 4,
            742: 4,
            748: 4,
            789: 4,
            797: 4,
            914: 4,
            915: 4,
            923: 4,
            924: 4,
            925: 4,
            955: 4,
            956: 4,
            979: 4,
            985: 4,
            996: 4,
            705: -1,
            777: -1,
            990: -1,
            713: -1,
            896: -1,
            738: -1,
            298: -1,
            118: -1,
            221: -1,
            771: -1,
            292: -1,
            295: -1,
            117: -1,
            127: -1,
            230: -1,
            313: -1,
            361: -1,
            417: -1,
            760: -1,
            786: -1,
            795: -1,
            850: -1,
            879: -1,
            989: -1,
            197: -1,
            449: -1,
            583: -1,
            812: -1,
            813: -1,
            817: -1,
            921: -1,
        },
    },
    gold_gems: {
        ak47: {
            784: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061793/C476C4576DF5217FFDD4033802FA3EBBFC98283F/',
                rank: 1,
            },
            219: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061800/6451EA98A2249DDEB81800F9A29BDAEA039BDE54/',
                rank: 2,
            },
            473: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061813/0B6270421CC7C4D0130BF54019F12C227F0F8C77/',
                rank: 3,
            },
            538: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061805/2B2E16B1A664A2815D3C9BC19527B5AF0F730C18/',
                rank: 4,
            },
        },
        fiveseven: {
            691: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061922/459921EF71F110285046399302DB8254B05B9C6A/',
                rank: 1,
            },
        },
        bayonet: {
            395: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061820/2CA72575404C0F3966F41C699697455FF6BAE3A9/',
                rank: 1,
            },
            848: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061832/0DF9DE84BA87F7268C6E9FBE3CDFDDA7FD80F236/',
                rank: 2,
            },
            359: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061841/DD9B6414E6A27BEA918358E9FC7F99750C824A6D/',
                rank: 3,
            },
        },
        bowie: {
            113: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061853/D64E3902B7267F2F6C5771FC0BD18A9BC0662410/',
                rank: 1,
            },
            599: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061861/E4E0A21EC0FEA7256C7D5884966C0A282FC8E4A3/',
                rank: 2,
            },
        },
        butterfly: {
            75: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061867/2CA55115A8211A413C7D50DAE39D9D95E96C8153/',
                rank: 1,
            },
            599: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061874/429E4D45474D85213FC6BFF9C01BB85EBE6681D6/',
                rank: 2,
            },
        },
        classic: {
            943: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061887/E0947C21FA495E2621ED9940F6AD988B83D5FE6A/',
                rank: 1,
            },
            527: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061898/0532F5D59F597922688AAD1A97C5637E8EFF9DB1/',
                rank: 2,
            },
        },
        falchion: {
            926: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061903/05C36BE70EAAE19FA1F5C27B77EDF2522795C7E2/',
                rank: 1,
            },
            279: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061908/A7C85D0DA540668FEC1612E94B8FA2C6E0F1D3D3/',
                rank: 2,
            },
            386: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061913/62B0B522126DA13FCF8278F5D02BC805BB823698/',
                rank: 3,
            },
        },
        flip: {
            731: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061929/61F60206335CC9A0BA71F0135237A0EC360BB173/',
                rank: 1,
            },
        },
        gut: {
            837: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061935/BCA0310C9887C9AE40ECB308C205523F15C01593/',
                rank: 1,
            },
        },
        huntsman: {
            759: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061941/507C1324961F06BC8995AF64A254BAD12EA0E1BA/',
                rank: 1,
            },
            41: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061950/F6BEBC2177259054EE8B0DC1041AB44D65B3BC75/',
                rank: 2,
            },
        },
        karambit: {
            896: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061962/87338F046BCEFB0E2C6360992B53863FF6D49F11/',
                rank: 1,
            },
            231: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061967/D210B9F05F57C0F62A2451A6B054EC5F98602ECA/',
                rank: 2,
            },
        },
        m9: {
            739: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061987/A655477B6724581DF81F3162B7F10BFD36C1B156/',
                rank: 1,
            },
            787: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911061996/A616B9E79CD11B7C710B20CD69E60FC3AE6B6959/',
                rank: 2,
            },
            471: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911062005/614837AF848F7EE02DBE66671F84779EE4A8DDE4/',
                rank: 3,
            },
        },
        navaja: {
            36: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911062017/C7CA5AD9DD82F3ABF429561BEA1E4A5458E5BB3F/',
                rank: 1,
            },
        },
        nomad: {
            39: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911062027/8279C27817034E40DA8B0E9A45A6D4CAE2160C40/',
                rank: 1,
            },
            912: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911062036/DF68265DDB5902E8F040421E40316DE0B434626B/',
                rank: 2,
            },
            263: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911062041/28479027528D751116A8A532F8CB12BB13F04E72/',
                rank: 3,
            },
        },
        paracord: {
            521: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911062049/42B0C74ACB4AA96696D4C7DEE0EFD1E13257478E/',
                rank: 1,
            },
        },
        skeleton: {
            914: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911062055/6E34D1E3C525254D800FA999B51044FE44E358B2/',
                rank: 1,
            },
            943: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911062063/64B244FA17764E4B1500302498929DFD0432AFBB/',
                rank: 2,
            },
        },
        stiletto: {
            268: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911062070/B2EE2789B6A58B9B979530E8BD9E0E440EC206B5/',
                rank: 1,
            },
            895: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911062078/0FCFFBA04B94EA58FDBCEF8287C5E2C7C2505356/',
                rank: 2,
            },
        },
        survival: {
            927: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911062085/D3E773A008018F97F2BDD9A26CD064B3FB9A4909/',
                rank: 1,
            },
            195: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911062092/6E99829B502A9C5A8E97E80A641D93FD3CB518C9/',
                rank: 2,
            },
        },
        talon: {
            834: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911062123/31DA60AA19CF163A323506E1425354B94E550EEB/',
                rank: 1,
            },
            993: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911062128/C87D477C13550DD4ACBEC0F5EEAE63479454FE8F/',
                rank: 2,
            },
        },
        ursus: {
            425: {
                img: 'https://steamuserimages-a.akamaihd.net/ugc/1812113931911062134/0C5EB694118D8282B824B0259739111D34518428/',
                rank: 1,
            },
        },
    },
};

export default patterns;
