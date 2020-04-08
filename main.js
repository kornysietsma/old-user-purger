const { WebClient, WebClientEvent, ErrorCode } = require("@slack/web-api");
const moment = require("moment");

const web = new WebClient(process.env.SLACK_TOKEN);
const VoidChannel = "C011B2FJ90S";

const previewMode = true;

web.on(WebClientEvent.RATE_LIMITED, (numSeconds) => {
  console.log(
    `A rate-limiting error occurred and the app is going to retry in ${numSeconds} seconds.`
  );
});

function simplifyUser(user) {
  if (user.name === "slackbot" || user.name === "robert.villacis26") {
    console.log({ ...user });
  }
  return {
    id: user.id,
    name: user.name,
    title: user.profile.title,
    deleted: user.deleted,
    real_name: user.real_name,
    is_admin: user.is_admin,
    is_bot: user.is_bot,
    updated: moment.unix(user.updated),
    updated_at: moment.unix(user.updated).toISOString(),
  };
}

async function getVoided(web) {
  var users = [];
  for await (const page of web.paginate("conversations.members", {
    channel: VoidChannel,
  })) {
    users = [...users, ...page.members];
  }
  return users;
}

async function userChannels(web, user) {
  let channels = [];
  for await (const page of web.paginate("users.conversations", {
    exclude_archived: true,
    types: "public_channel",
    user: user.id,
  })) {
    const channelData = page.channels.map((c) => {
      return { id: c.id, name: c.name };
    });
    channels = [...channels, ...channelData];
  }
  return channels;
}

async function sendToVoid(web, user) {
  const channels = await userChannels(web, user);

  console.log(`inviting ${user.name} to the void`);
  if (!previewMode) {
    await web.conversations.invite({ channel: VoidChannel, users: user.id });
  }
  for (const channel of channels) {
    if (channel.id !== VoidChannel && channel.name !== 'hello') {
      console.log(`kicking ${user.name} from ${channel.name}`);
      if (!previewMode) {
        await web.conversations.kick({ channel: channel.id, user: user.id });
      }
    }
  }
}

async function run(web) {
  try {
    const voidedUserList = await getVoided(web);
    console.log("alredy voided:", voidedUserList);
    const voidedUsers = new Set(voidedUserList);

    var users = [];
    const cutoffDate = moment().subtract(1, "years");
    console.log("cutoff:", cutoffDate.toISOString());
    for await (const page of web.paginate("users.list", { limit: 50 })) {
      oldUsers = page.members
        .map((m) => simplifyUser(m))
        .filter((m) => {
          const isOld = m.updated.isBefore(cutoffDate);
          const alreadyVoided = voidedUsers.has(m.id);
          const hasTitle = m.title !== undefined && m.title !== "";
          const isCandidate =
            isOld &&
            !m.is_admin &&
            !m.is_bot &&
            !m.deleted &&
            !hasTitle &&
            !(m.name === "slackbot") &&
            !alreadyVoided;
          console.log(
            "check",
            m.name,
            m.is_admin,
            m.is_bot,
            m.deleted,
            m.updated.toISOString(),
            `'${m.title}'`,
            isCandidate
          );
          return isCandidate;
        });
      users = [...users, ...oldUsers];
      if (users.length > 5) {
        break;
      }
    }
    for (const u of users) {
      await sendToVoid(web, u);
    }
    return "ok";
  } catch (error) {
    // Check the code property, and when its a PlatformError, log the whole response.
    if (error.code === ErrorCode.PlatformError) {
      console.log(error.data);
      process.exit(1);
    } else {
      console.log("Unexpected error", error);
      process.exit(1);
    }
  }
}

run(web).then((results) => {
  console.log("results:", results);
});
