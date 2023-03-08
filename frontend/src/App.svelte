<script>
  import { Router, Link, Route } from "svelte-routing"
  import Home from "./routes/Home.svelte"
  import MyGroups from "./routes/MyGroups.svelte"
  import CreateGroup from "./routes/CreateGroup.svelte"
  import Profile from "./routes/Profile.svelte"
  import Group from "./routes/Group.svelte"

  export let url = ""
</script>

<main>
  <Router url="{url}">
    <nav class="navigation">
      <Link to="/">
        <img src="/NotifyUs_Logo.png" class="logo" alt="NotifyUs Logo"/>
      </Link>
      <Link to="groups">My Groups</Link>
      <Link to="create-group">Create Group</Link>
      <Link to="profile">Profile</Link>
    </nav>
    <div>
      <Route path="/" component="{Home}" />
      <Route path="groups" component="{MyGroups}" />
      <Route path="create-group" component="{CreateGroup}" />
      <Route path="profile" component="{Profile}" />
      <Route path="group/:id" component="{Group}" />
    </div>
  </Router>
</main>

<style>
  .logo {
    height: 3em;
    padding: 0.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 1em #464647ec);
  }
  .navigation {
    background-color: #dfdfdfec;
    display: flex;
    font-size: large;
    align-items: center;
    gap: 40px;
  }
  main {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }
</style>
