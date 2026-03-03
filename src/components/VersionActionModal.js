"use client";

import { useState } from "react";
import { Copy, Terminal, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function VersionActionModal({ isOpen, onClose, versionType, versionValue, repoOwner, repoName }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const repoUrl = `https://github.com/${repoOwner}/${repoName}.git`;

  let checkoutCmd = "";
  if (versionType === "release") {
    checkoutCmd = `git fetch --all --tags\ngit checkout tags/${versionValue}`;
  } else if (versionType === "branch") {
    checkoutCmd = `git fetch origin\ngit checkout ${versionValue}`;
  } else if (versionType === "commit") {
    checkoutCmd = `git fetch origin\ngit checkout ${versionValue}`;
  }

  const fullCommand = `git clone ${repoUrl}\ncd ${repoName}\n${checkoutCmd}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Use This Version</DialogTitle>
          <DialogDescription>
            Copy the following commands to your local terminal to checkout this specific {versionType}.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mt-4">
           <div className="absolute top-3 right-3 flex gap-2">
              <Button size="icon" variant="secondary" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleCopy}>
                 {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </Button>
           </div>
           <div className="bg-zinc-950 dark:bg-black p-4 rounded-lg overflow-x-auto border border-zinc-800 font-mono text-sm shadow-inner">
             <div className="flex items-center text-zinc-500 mb-2 select-none">
                <Terminal size={14} className="mr-2" /> Terminal
             </div>
             <pre className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
               {fullCommand.split('\n').map((line, i) => (
                  <div key={i}>
                    <span className="text-zinc-600 select-none mr-3">$</span>
                    <span className="text-zinc-200">{line}</span>
                  </div>
               ))}
             </pre>
           </div>
        </div>
        
        <div className="text-xs text-muted-foreground mt-2 bg-secondary/50 p-3 rounded-md border flex items-start gap-2">
           <info className="text-blue-500 mt-0.5">i</info>
           <span>These commands will clone the repository into a new folder and switch your local environment to the exact state of this version. This platform does not execute git commands directly.</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
