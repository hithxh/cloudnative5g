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

import { Button, Typography } from "@material-ui/core";
import React from "react";
import { ReactComponent as PageNotFoundIcon } from "../assets/icons/page_not_found.svg";

function PageNotFound(props) {
  return (
    <div style={{ textAlign: "center" }}>
      <PageNotFoundIcon />
      <Typography variant="h5" color="primary">
        Sorry, Page Not Found
      </Typography>
      <Typography variant="subtitle1" color="textSecondary">
        <strong>The page you are looking for does not seem to exist</strong>
        <br />
        <Button
          variant="contained"
          color="primary"
          href="/apps"
          style={{ marginTop: "40px" }}
        >
          Go Home
        </Button>
      </Typography>
    </div>
  );
}

export default PageNotFound;
