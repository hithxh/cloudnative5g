# Pull base image
# ---------------
FROM openjdk:8-jdk-alpine 

# Environment variables required for this build (do NOT change)
# -------------------------------------------------------------

ENV ORACLE_HOME=/oic/oauthproxy \
    PATH=$PATH:/usr/java/default/bin:/usr/sbin \
    LANG="en_US.UTF-8" \
    LC_ALL="en_US.UTF-8"

# Configure shaded jar
# ------------------------------------------------------------
COPY oauthproxy-1.0-SNAPSHOT.jar  /oic/oauthproxy/
COPY Dockerfile  /oic/oauthproxy/

# Setup filesystem and oracle user
# ------------------------------------------------------------
RUN chmod a+xr /oic/oauthproxy && \
    adduser -D -h /oic/oauthproxy -s /bin/bash oracle && \
    echo oracle:oracle | chpasswd

RUN chown oracle:oracle -R /oic

USER oracle

WORKDIR $ORACLE_HOME

# Define default command to start bash.
ENTRYPOINT ["java", "-jar", "oauthproxy-1.0-SNAPSHOT.jar"]
