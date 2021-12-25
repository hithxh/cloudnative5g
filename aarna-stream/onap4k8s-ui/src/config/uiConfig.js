//=======================================================================
// Copyright (c) 2017-2020 Aarna Networks, Inc.
// All rights reserved.
// ======================================================================
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//           http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// ========================================================================

import React from "react";
// import HomeIcon from "@material-ui/icons/Home";
import DashboardIcon from "@material-ui/icons/Dashboard";
import DeviceHubIcon from "@material-ui/icons/DeviceHub";
import DnsRoundedIcon from "@material-ui/icons/DnsRounded";
import PeopleIcon from "@material-ui/icons/People";
import SettingsIcon from "@material-ui/icons/SettingsRounded";
import LogicalCloudIcon from "@material-ui/icons/SettingsSystemDaydream";

const adminMenu = [
  {
    id: "adminMenu",
    children: [
      {
        id: "Tenants",
        icon: <PeopleIcon />,
        url: "/projects",
      },
      {
        id: "K8s Controllers",
        icon: <SettingsIcon />,
        url: "/controllers",
      },
      {
        id: "Clusters",
        icon: <DnsRoundedIcon />,
        url: "/clusters",
      },
    ],
  },
];
const tanentMenu = [
  {
    id: "tanentMenu",
    children: [
      {
        id: "Dashboard",
        icon: <DashboardIcon />,
        url: "/dashboard",
      },
      {
        id: "Services",
        icon: <DeviceHubIcon />,
        url: "/services",
      },
      {
        id: "Service Instances",
        icon: <DnsRoundedIcon />,
        url: "/deployment-intent-groups",
      },
      {
        id: "Logical Clouds",
        icon: <LogicalCloudIcon />,
        url: "/logical-clouds",
      },
    ],
  },
];

export { adminMenu };
export { tanentMenu };
export default { adminMenu: adminMenu, tanentMenu: tanentMenu };
