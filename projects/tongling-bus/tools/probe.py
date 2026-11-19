"""Small anonymous, read-only check of endpoints used by Tongling's public page.

No cookie jar, account login, payment requests, or continuous polling.
Usage: python probe.py --output ../../outputs/tongling-probe.json
"""

import argparse
import hashlib
import json
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

BASE = "https://wx.tlgjzgs.com/Interact/TouchScreen/"
READ_ENDPOINTS = {
    "GetLineInfoByLine", "GetLineStationGpsData", "GetLinePlanInfos",
    "GetStationName", "GetLineInfosByStation", "GetTransferInfo", "getNotice",
}


def read(endpoint, params=None, method="GET"):
    if endpoint not in READ_ENDPOINTS:
        raise ValueError("Endpoint is outside the public read-only allowlist")
    encoded = urllib.parse.urlencode(params or {}).encode("utf-8")
    url = BASE + endpoint
    if method == "GET" and encoded:
        url += "?" + encoded.decode("ascii")
    request = urllib.request.Request(
        url, data=encoded if method == "POST" else None,
        headers={"Accept": "application/json", "User-Agent": "TonglingWidgetResearch/0.1"},
        method=method,
    )
    started = time.monotonic()
    with urllib.request.urlopen(request, timeout=12) as response:
        payload = response.read()
        status = response.status
    return json.loads(payload.decode("utf-8-sig")), {
        "endpoint": endpoint, "method": method, "parameters": params or {},
        "status": status, "seconds": round(time.monotonic() - started, 3),
        "response_sha256": hashlib.sha256(payload).hexdigest(),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--line", default="1", help="Exact route label without the Chinese route suffix")
    parser.add_argument("--direction", type=int, choices=[1, 2], default=1)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    results = []
    lines, evidence = read("GetLineInfoByLine", {"lineName": "", "domainId": "false"}, "POST")
    results.append(evidence)
    target = next((row for row in lines if row["AliasName"] == args.line + "\u8def"
                   and row["Direction"] == args.direction), None)
    if target is None:
        raise ValueError("Selected route and direction were not present in the public response")
    route_params = {"lineid": target["LineId"], "direction": args.direction, "domainId": "false"}
    gps, evidence = read("GetLineStationGpsData", route_params)
    results.append(evidence)
    stations = gps.get("lineStationInfoTemp", [])
    vehicles = gps.get("lineGpsListTemp", [])
    if not stations:
        raise ValueError("The selected route returned no station list")
    station_names, evidence = read("GetStationName", {
        "stationName": stations[0]["StationName"][:2], "domainId": "false"}, "POST")
    results.append(evidence)
    selected_station = stations[min(8, len(stations) - 1)]["StationName"]
    station_lines, evidence = read("GetLineInfosByStation", {
        "stationName": selected_station, "domainId": "false"}, "POST")
    results.append(evidence)
    plan, evidence = read("GetLinePlanInfos", route_params)
    results.append(evidence)
    transfer, evidence = read("GetTransferInfo", {
        "startStationName": stations[0]["StationName"],
        "endStationName": stations[-1]["StationName"], "domainId": "false"}, "POST")
    results.append(evidence)
    notice, evidence = read("getNotice")
    results.append(evidence)
    expanded = [s for row in station_lines for s in row.get("lineStationInfos", [])]
    valid_station_coordinates = sum(
        bool(s.get("Latitude")) and bool(s.get("Longitude")) for s in expanded)
    summary = {
        "checked_at": datetime.now(timezone(timedelta(hours=8))).isoformat(timespec="seconds"),
        "authorization": "anonymous; no Cookie or Authorization header supplied",
        "line_direction_records": len(lines),
        "distinct_line_ids": len({row["LineId"] for row in lines}),
        "selected_route": target,
        "stations": len(stations),
        "vehicle_records": len(vehicles),
        "operating_vehicle_records": sum(v.get("IsOperate") is True for v in vehicles),
        "vehicle_fields": sorted({key for vehicle in vehicles for key in vehicle}),
        "station_name_matches": len(station_names),
        "selected_station": selected_station,
        "station_line_direction_matches": len(station_lines),
        "station_coordinate_records_examined": len(expanded),
        "station_records_with_nonzero_coordinates": valid_station_coordinates,
        "next_departure": plan,
        "transfer_results": len(transfer),
        "notice_return_type": type(notice).__name__,
        "requests": results,
        "limitations": [
            "Vehicle responses identify a station; sampled responses have no GPS coordinates or vehicle timestamp.",
            "GetLinePlanInfos is a departure schedule, not an arrival prediction.",
            "A single successful read does not guarantee future availability or access rights for distribution.",
            "WeChat payment-code access and Android device behavior were not tested.",
        ],
    }
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
