"""Package a verified, signed APK plus an explicit public-source allowlist."""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import zipfile
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apk", type=Path, required=True)
    parser.add_argument("--apksigner", type=Path, required=True)
    args = parser.parse_args()
    subprocess.run([str(args.apksigner), "verify", "--verbose", str(args.apk)], check=True)
    config = (PROJECT / "source/app/build.gradle.kts").read_text(encoding="utf-8")
    version = re.search(r'versionName = "([\d.]+)"', config).group(1)
    code = int(re.search(r'versionCode = (\d+)', config).group(1))
    dest = PROJECT / "packages"
    dest.mkdir(exist_ok=True)
    apk_name = f"tongling-bus-{version}.apk"
    shutil.copyfile(args.apk, dest / apk_name)
    shutil.copyfile(args.apk, dest / "tongling-bus.apk")
    fixed_source = ["settings.gradle.kts", "build.gradle.kts", "gradle.properties", ".gitignore", "README.md",
                    "gradlew", "gradlew.bat", "gradle/wrapper/gradle-wrapper.jar", "gradle/wrapper/gradle-wrapper.properties", "app/build.gradle.kts"]
    public = [PROJECT / "README.md", PROJECT / "source/DESIGN.md", PROJECT / "docs/api.md",
              PROJECT / "docs/validation.md", PROJECT / "tests/README.md", PROJECT / "tools/README.md",
              PROJECT / "tools/probe.py", PROJECT / "tools/package.py"]
    public += [PROJECT / "source" / name for name in fixed_source]
    public += [file for file in (PROJECT / "source/app/src").rglob("*") if file.is_file() and file.suffix in (".kt", ".xml")]
    missing = [str(file.relative_to(PROJECT)) for file in public if not file.is_file()]
    if missing:
        raise RuntimeError("Missing required public files: " + ", ".join(missing))
    archive = dest / f"tongling-bus-{version}-source.zip"
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as z:
        for file in sorted(set(public)):
            z.write(file, "tongling-bus/" + file.relative_to(PROJECT).as_posix())
    shutil.copyfile(archive, dest / "tongling-bus-source.zip")
    latest = {"versionName": version, "versionCode": code, "minSdk": 26,
              "url": "https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/tongling-bus/packages/tongling-bus.apk",
              "sha256": digest(dest / "tongling-bus.apk"),
              "notes": "首次安卓版本：公交站序、车牌、收藏、三种桌面组件和限时候车；精确GPS、分钟预测及直接亮码未接入。"}
    (dest / "latest.json").write_text(json.dumps(latest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    checksum_names = [apk_name, "tongling-bus.apk", archive.name, "tongling-bus-source.zip"]
    (dest / "SHA256SUMS.txt").write_text("".join(f"{digest(dest / name)}  {name}\n" for name in checksum_names), encoding="utf-8")
    print(json.dumps({"version": version, "apk_bytes": (dest / apk_name).stat().st_size,
                      "source_files": len(set(public)), "apk_sha256": latest["sha256"]}))


if __name__ == "__main__":
    main()
