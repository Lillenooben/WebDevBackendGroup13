<script>
  import { Router, Link, Route, navigate } from "svelte-routing"
  import Home from "./lib/Home.svelte"
  import MyGroups from "./lib/MyGroups.svelte"
  import CreateGroup from "./lib/CreateGroup.svelte"
  import Profile from "./lib/Profile.svelte"
  import Group from "./lib/Group.svelte"
  import Login from "./lib/Login.svelte"
  import Signup from "./lib/Signup.svelte"
  import CreateEvent from "./lib/CreateEvent.svelte"
  import UpdateGroup from "./lib/UpdateGroup.svelte"
  import UpdateEvent from "./lib/UpdateEvent.svelte"

  export let url = ""

  import { user } from "./user-store.js"

  if (!$user.isLoggedIn) {
    navigate("/login")
    console.log("not logged in, redirecting")
  }
</script>

<div id="layout">
  
  <Router url="{url}">
    {#if $user.isLoggedIn}
      <nav id="navigation">
        <Link to="/">
          <img src="/NotifyUs_Logo.png" class="logo" alt="NotifyUs Logo"/>
        </Link>
        <Link to="/">Home</Link>
        <Link to="groups">My Groups</Link>
        <Link to="create-group">Create Group</Link>
        <Link to="profile">Profile</Link>
      </nav>
    {/if}
    <main>
        <Route path="/" component="{Home}" />
        <Route path="groups" component="{MyGroups}" />
        <Route path="create-group" component="{CreateGroup}" />
        <Route path="profile" component="{Profile}" />
        <Route path="group/:id" component="{Group}" />
        <Route path="group/update/:id" component="{UpdateGroup}" />
        <Route path="login" component="{Login}" />
        <Route path="signup" component="{Signup}" />
        <Route path="create-event/:id" component="{CreateEvent}" />
        <Route path="event/update/:id" component="{UpdateEvent}" />
    </main>
  </Router>

</div>

<style>
  .logo {
    height: 3em;
    padding: 0.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(5px 5px 10px #464647ec);
  }
  #navigation {
    background-color: #92A1B3;
    display: flex;
    font-size: large;
    align-items: center;
    gap: 40px;
    border-bottom: 1px solid #213547;
  }
  #layout {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }
</style>
