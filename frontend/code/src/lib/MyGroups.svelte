<script>
    import { navigate } from "svelte-routing"

    const clicked = () => {
        navigate("group/1")
    }
</script>

<main>
    <h1>My Groups</h1>
    <div class="group-card"><button on:click={clicked}>Placeholder group card</button></div>
    <div class="group-card"><button on:click={clicked}>Placeholder group card</button></div>
    <div class="group-card"><button on:click={clicked}>Placeholder group card</button></div>
    <div class="group-card"><button on:click={clicked}>Placeholder group card</button></div>
</main>

<style>
    .group-card {
        margin: 1em;
    }
    .group-card button {
        padding: 2em;
    }
</style>