/**
* NOTE: Phaser.Group no longer exists in Phaser 3.
* Groups work differently in Phaser 3 - they use Phaser.GameObjects.Group
* This enhancement is disabled for Phaser 3 migration.
* If needed, this functionality should be reimplemented using Phaser 3 Group API.
*/

// Phaser 2 code - disabled for Phaser 3
/*
Phaser.Group.prototype.removeAll = function (destroy, silent) {

    if (typeof destroy === 'undefined') { destroy = false; }
    if (typeof silent === 'undefined') { silent = false; }

    if (this.children.length === 0)
    {
        return;
    }

    var i = 0;

    do
    {
        if(this.children[i].doNotDestroy) {
            i++;
        }

        if (!silent && this.children[i].events)
        {
            this.children[i].events.onRemovedFromGroup.dispatch(this.children[i], this);
        }

        var removed = this.removeChild(this.children[i]);

        if (destroy && removed)
        {
            removed.destroy(true);
        }
    }
    while (this.children.length > i);

    this.cursor = null;

};
*/