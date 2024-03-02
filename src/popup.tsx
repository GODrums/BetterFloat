import "~base.css"
import "~style.css"
import { Button, Tabs, TabsList, TabsTrigger } from "~lib/shadcn"
import { IcRoundWarning, MdiGithub, SkillIconsDiscord, SkinBidIcon, SolarDocumentTextLinear, SolarInfoSquareLinear } from "~lib/icons"
import betterfloatLogo from "data-base64:~/../assets/icon.png"
import csfloatLogo from "data-base64:~/../assets/csfloat.png"
import skinportLogo from "data-base64:~/../assets/skinport.ico"
import { CSFloatSettings } from "~lib/pages/Csfloat"
import { SettingsTooltip } from "~lib/components/SettingsTooltip"
import { SkinportSettings } from "~lib/pages/Skinport"
import { DISCORD_URL, GITHUB_URL } from "~lib/util/globals"
import { SkinbidSettings } from "~lib/pages/Skinbid"
import { SparklesCore } from "~lib/components/Sparkles"
import { Changelogs } from "~lib/pages/Changelog"
import { About } from "~lib/pages/About"
import { useEffect, useState } from "react"

export default function IndexPopup() {
  // TODO: Add warning banner when changing a setting

  const hostpermissions = chrome.runtime.getManifest().host_permissions;

  const [openPermissions, setOpenPermissions] = useState(false);

  const requestPermissions = () => {
    chrome.permissions.request({
      origins: hostpermissions
    }).then((granted) => {
      if (!granted) {
        console.log("Permission denied");
      } else {
        document.getElementById("permissions-warning").classList.add("hidden");
        setOpenPermissions(false);
      }
    });
  };

  useEffect(() => {
    document.getElementById("version").textContent = `v. ${chrome.runtime.getManifest().version}`;

    chrome.permissions.contains({
      origins: hostpermissions
    }).then((result) => {
      if (!result) {
        document.getElementById("permissions-warning").classList.remove("hidden");
        setOpenPermissions(true);
      }
    })
  });

  return (
    <div className="dark flex flex-col bg-card justify-between h-[600px] w-[430px]">
      <header className="w-full flex align-middle justify-between px-4 py-1.5 bg-card text-card-foreground border-b border-muted shadow-sm">
        <div className="flex gap-2 align-middle items-center">
          <img className="h-[38px]" src={betterfloatLogo} />
          <p id="version" className="text-sm font-bold text-muted-foreground">v. 2.0.0</p>
        </div>
        <div className="flex gap-1">
          <SettingsTooltip text="The extension is missing some permissions!" open={openPermissions}>
            <Button variant="ghost" size="icon" className="hidden" id="permissions-warning">
              <IcRoundWarning height={30} width={30} filter="invert(19%) sepia(98%) saturate(7473%) hue-rotate(359deg) brightness(103%) contrast(109%)" onClick={requestPermissions} />
            </Button>
          </SettingsTooltip>

          <SettingsTooltip text={DISCORD_URL}>
            <Button variant="ghost" size="icon" onClick={(e) => window.open(DISCORD_URL)}>
              <SkillIconsDiscord height={30} width={30} />
            </Button>
          </SettingsTooltip>

          <SettingsTooltip text={GITHUB_URL}>
            <Button variant="ghost" size="icon" onClick={() => window.open(GITHUB_URL)}>
              <MdiGithub height={30} width={30} color="white" />
            </Button>
          </SettingsTooltip>
        </div>
      </header>
      <div className="h-[40rem] relative w-full bg-black flex flex-col items-center justify-center overflow-hidden rounded-md">
        <div className="w-full absolute inset-0 h-screen">
          <SparklesCore
            id="tsparticlesfullpage"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={50}
            className="w-full h-full"
            particleColor="#FFFFFF"
          />
        </div>
        <Tabs defaultValue="csfloat" className="flex gap-2 my-2 h-full" orientation="vertical">
          <TabsList className="flex justify-between bg-background/80 text-card-foreground z-50">
            <div className="flex flex-col items-center">
              <p className="text-md font-bold py-2 uppercase">Sites</p>
              <TabsTrigger value="csfloat">
                <img className="h-10 w-10 rounded-lg" src={csfloatLogo} />
              </TabsTrigger>
              <TabsTrigger value="skinport">
                <img className="h-10 w-10 rounded-lg" src={skinportLogo} />
              </TabsTrigger>
              <TabsTrigger value="skinbid">
                <SkinBidIcon height={48} width={48} />
              </TabsTrigger>
            </div>
            <div className="flex flex-col items-center">
              <TabsTrigger value="changelog">
                <SolarDocumentTextLinear className="h-10 w-10" />
              </TabsTrigger>
              <TabsTrigger value="about">
                <SolarInfoSquareLinear className="h-10 w-10" />
              </TabsTrigger>
            </div>
          </TabsList>
          <CSFloatSettings />
          <SkinportSettings />
          <SkinbidSettings />
          <Changelogs />
          <About />
        </Tabs>
      </div>

    </div>
  )
}
