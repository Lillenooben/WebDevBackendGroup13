<script>
    import { user } from "../user-store.js"
    import { navigate } from "svelte-routing"

    function logout() {
        $user.isLoggedIn = false
        navigate("/login")
    }
</script>

<h1>[Username]</h1>
<img alt="Profile"> <!--Placeholder-->
<button>Edit image</button>

<h2>Settings</h2>
<p>Various account and notification settings go here</p>
<button on:click={logout}>Log out</button>
